const express = require('express');
const path = require('path');
const os = require('os');
const cors = require('cors');
const mm = require('music-metadata');
const fs = require('fs').promises;
const db = require('./database');
const http = require('http');
const WebSocket = require('ws');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');

// --- Server and WebSocket Setup ---
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = 3001;

ffmpeg.setFfmpegPath(ffmpegStatic);
app.use(cors());
app.use(express.json());
db.initializeDatabase();

// --- In-Memory Conversion Queue & State ---
let conversionQueue = [];
let isConverting = false;
let isPaused = false;

// --- WebSocket Logic ---
wss.on('connection', ws => {
    console.log('Client connected to WebSocket');
    // Send the current queue state to the newly connected client
    ws.send(JSON.stringify({ type: 'queue_update', queue: conversionQueue }));
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// --- Helper Functions ---
const allowedExtensions = [ '.dsf', '.dff', '.wav', '.aiff', '.aif', '.bwf', '.flac', '.wv', '.ape', '.opus', '.ogg', '.oga', '.aac', '.mpc', '.mp3', '.wma', '.mp2', '.spx', '.mka', '.mkv', '.webm', '.mp4', '.m4a', '.asf' ];

const getTracksInDir = async (directoryPath) => {
    let tracks = [];
    let otherFiles = [];
    try {
        const direntsInDir = await fs.readdir(directoryPath, { withFileTypes: true });
        for (const dirent of direntsInDir) {
            const fullPath = path.join(directoryPath, dirent.name);
            if (dirent.isFile()) {
                const extension = path.extname(dirent.name).toLowerCase();
                if (allowedExtensions.includes(extension)) {
                    try {
                        const metadata = await mm.parseFile(fullPath);
                        tracks.push({ name: path.parse(dirent.name).name, extension: path.extname(dirent.name), path: fullPath, bitrate: metadata.format.bitrate ? `${Math.round(metadata.format.bitrate / 1000)} kbps` : 'N/A', bitDepth: metadata.format.bitsPerSample ? `${metadata.format.bitsPerSample}-bit` : 'N/A', sampleRate: metadata.format.sampleRate ? `${metadata.format.sampleRate / 1000} kHz` : 'N/A' });
                    } catch (err) { otherFiles.push({ name: dirent.name, path: fullPath, reason: 'Could not read metadata.' }); }
                } else { otherFiles.push({ name: dirent.name, path: fullPath, reason: 'Unsupported file type.' }); }
            }
        }
    } catch (error) {
        console.error(`Error reading directory ${directoryPath}:`, error.message);
    }
    return { tracks, otherFiles };
};

async function scanDirectory(musicPath) {
    const originalTracks = [];
    const convertedTracks = [];
    const artistDirents = await fs.readdir(musicPath, { withFileTypes: true });
    for (const artistDirent of artistDirents) {
        if (!artistDirent.isDirectory()) continue;
        const artistName = artistDirent.name;
        const artistPath = path.join(musicPath, artistDirent.name);
        const albumDirents = (await fs.readdir(artistPath, { withFileTypes: true })).filter(d => d.isDirectory());
        for (const albumDirent of albumDirents) {
            const albumName = albumDirent.name;
            const albumPath = path.join(artistPath, albumDirent.name);

            // root-level tracks (disc is album name)
            const rootScan = await getTracksInDir(albumPath);
            for (const t of rootScan.tracks) {
                originalTracks.push({
                    trackName: t.name,
                    album: albumName,
                    disc: albumName,
                    artist: artistName,
                    extension: t.extension,
                    bitDepth: t.bitDepth,
                    sampleRate: t.sampleRate,
                    path: t.path
                });
            }

            // subfolders
            const subfolders = (await fs.readdir(albumPath, { withFileTypes: true })).filter(d => d.isDirectory());
            for (const subfolder of subfolders) {
                const subfolderPath = path.join(albumPath, subfolder.name);
                if (subfolder.name.toLowerCase() === 'converted') {
                    const convertedScan = await getTracksInDir(subfolderPath);
                    for (const ct of convertedScan.tracks) {
                        convertedTracks.push({
                            trackName: ct.name,
                            album: albumName,
                            disc: albumName, // best-effort; if discs exist, disc folder name is not captured here
                            artist: artistName,
                            extension: ct.extension,
                            bitDepth: ct.bitDepth,
                            sampleRate: ct.sampleRate,
                            path: ct.path
                        });
                    }
                    continue;
                }

                const discName = subfolder.name;
                const discScan = await getTracksInDir(subfolderPath);
                for (const t of discScan.tracks) {
                    originalTracks.push({
                        trackName: t.name,
                        album: albumName,
                        disc: discName,
                        artist: artistName,
                        extension: t.extension,
                        bitDepth: t.bitDepth,
                        sampleRate: t.sampleRate,
                        path: t.path
                    });
                }
            }
        }
    }
    return { originalTracks, convertedTracks };
}

async function persistFlatLibrary(originalTracks, convertedTracks) {
    for (const track of originalTracks) { await db.insertTrackFlat(track); }
    for (const track of convertedTracks) { await db.insertConvertedFlat(track); }
}

// directory listing is now client-side; no server-side directories table

// --- Conversion Logic ---
async function processQueue() {
    if (isConverting || isPaused) return;

    const job = conversionQueue.find(item => item.status === 'Pending');
    if (!job) {
        console.log('Conversion queue finished or no pending jobs.');
        isConverting = false;
        broadcast({ type: 'queue_update', queue: conversionQueue });
        return;
    }

    isConverting = true;
    job.status = 'Converting';
    broadcast({ type: 'status_update', path: job.path, status: 'Converting' });
    console.log(`Starting conversion for: ${job.name} to target:`, job.targetSettings);

    const outputDir = path.join(path.dirname(job.path), 'converted');
    const outputFilename = `${path.parse(job.name).name}.${job.targetSettings.format.toLowerCase()}`;
    const outputPath = path.join(outputDir, outputFilename);

    try {
        await fs.mkdir(outputDir, { recursive: true });

        await new Promise((resolve, reject) => {
            const command = ffmpeg(job.path);
            const { format, bitrate, bitDepth, sampleRate } = job.targetSettings;

            const codecMap = { 'FLAC': 'flac', 'ALAC': 'alac', 'WAV': 'pcm_s16le', 'AIFF': 'pcm_s16be', 'Opus': 'libopus', 'Vorbis': 'libvorbis', 'AAC': 'aac', 'MP3': 'libmp3lame' };
            let targetCodec = codecMap[format];
            const targetBitDepth = parseInt(bitDepth, 10);
            if (format === 'WAV') {
                if (targetBitDepth === 24) targetCodec = 'pcm_s24le';
                else targetCodec = 'pcm_s16le';
            } else if (format === 'AIFF') {
                if (targetBitDepth === 24) targetCodec = 'pcm_s24be';
                else targetCodec = 'pcm_s16be';
            }
            if (targetCodec) { command.audioCodec(targetCodec); }

            if (targetCodec === 'flac') {
                if (targetBitDepth === 16) command.addOption('-sample_fmt', 's16');
                if (targetBitDepth === 24) command.addOption('-sample_fmt', 's32');
            }

            const targetBitrate = parseInt(bitrate, 10);
            if (['libmp3lame', 'aac', 'libopus', 'libvorbis'].includes(targetCodec)) { if (!isNaN(targetBitrate)) { command.audioBitrate(`${targetBitrate}k`); } }

            const targetSampleRate = parseFloat(sampleRate) * 1000;
            if (!isNaN(targetSampleRate)) { command.audioFrequency(targetSampleRate); }

            command
                .on('progress', (progress) => {
                    const percent = progress.percent ? progress.percent.toFixed(2) : 0;
                    broadcast({ type: 'progress', path: job.path, percent });
                })
                .on('end', async () => {
                    console.log(`Conversion for ${job.name} complete.`);
                    job.status = 'Complete';
                    broadcast({ type: 'status_update', path: job.path, status: 'Complete' });
                    try {
                        const meta = await mm.parseFile(outputPath);
                        const flat = {
                            trackName: meta.common && meta.common.title ? meta.common.title : path.parse(outputPath).name,
                            album: meta.common && meta.common.album ? meta.common.album : undefined,
                            disc: (meta.common && meta.common.disk && meta.common.disk.no) ? `Disc ${meta.common.disk.no}` : (meta.common && meta.common.album ? meta.common.album : undefined),
                            artist: meta.common && meta.common.artist ? meta.common.artist : undefined,
                            extension: path.extname(outputPath),
                            bitDepth: meta.format && meta.format.bitsPerSample ? `${meta.format.bitsPerSample}-bit` : 'N/A',
                            sampleRate: meta.format && meta.format.sampleRate ? `${meta.format.sampleRate / 1000} kHz` : 'N/A',
                            path: outputPath
                        };
                        await db.insertConvertedFlat(flat);
                    } catch (insErr) {
                        console.error('Failed to insert converted file metadata:', insErr);
                    }
                    resolve();
                })
                .on('error', (err) => { job.status = 'Error'; broadcast({ type: 'status_update', path: job.path, status: 'Error', reason: err.message }); reject(err); })
                .save(outputPath);
        });

    } catch (error) {
        job.status = 'Error';
        broadcast({ type: 'status_update', path: job.path, status: 'Error', reason: 'Failed to start FFmpeg.' });
    } finally {
        isConverting = false;
        processQueue();
    }
}

// --- API Endpoints ---

app.get('/api/library', async (req, res) => {
    try {
        const library = await db.getLibrary();
        res.json(library);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch library.' });
    }
});

app.post('/api/rename', async (req, res) => {
    const { oldPath, newName } = req.body;
    if (!oldPath || !newName) {
        return res.status(400).json({ error: 'Missing old path or new name.' });
    }
    if (/[\\/:"*?<>|]/.test(newName)) {
        return res.status(400).json({ error: 'New name contains invalid characters.' });
    }
    const parentDirectory = path.dirname(oldPath);
    const newPath = path.join(parentDirectory, newName);
    try {
        await fs.rename(oldPath, newPath);
        res.json({ success: true, message: 'Renamed successfully.' });
    } catch (error) {
        console.error(`[500] Error renaming path:`, error);
        res.status(500).json({ error: `Could not rename. Check permissions.` });
    }
});

app.post('/api/browse', async (req, res) => {
    const requestedPath = req.body.path || os.homedir();
    const currentPath = path.resolve(requestedPath);
    try {
        const dirents = await fs.readdir(currentPath, { withFileTypes: true });
        const files = dirents.filter(d => d.isDirectory()).map(d => ({ name: d.name, type: 'directory', path: path.join(currentPath, d.name) }));
        files.sort((a, b) => a.name.localeCompare(b.name));
        res.json({ path: currentPath, contents: files });
    } catch (error) {
        console.error(`[500] Error browsing path "${currentPath}":`, error);
        res.status(500).json({ error: `Could not read directory. Please check server permissions.` });
    }
});

app.post('/api/scan', async (req, res) => {
    const { paths } = req.body;
    if (!paths || !Array.isArray(paths) || paths.length === 0) return res.status(400).json({ error: 'paths must be a non-empty array.' });
    try {
        await db.clearLibrary();
        await db.clearConverted();
        for (const p of paths) {
            const { originalTracks, convertedTracks } = await scanDirectory(p);
            await persistFlatLibrary(originalTracks, convertedTracks);
        }
        const updatedLibrary = await db.getLibrary();
        res.json(updatedLibrary);
    } catch (error) {
        console.error('Scan failed with error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/fix-unnecessary-subfolder', async (req, res) => {
    const { albumPath } = req.body;
    if (!albumPath) {
        return res.status(400).json({ error: 'Album path is required.' });
    }

    try {
        const albumContents = await fs.readdir(albumPath, { withFileTypes: true });
        const subfolders = albumContents.filter(d => d.isDirectory());

        // Basic check: only try to fix if there is exactly one subfolder
        if (subfolders.length !== 1) {
            return res.status(400).json({ error: 'Expected exactly one subfolder to fix.' });
        }
        const subfolder = subfolders[0];
        const subfolderPath = path.join(albumPath, subfolder.name);
        
        const filesToMove = await fs.readdir(subfolderPath);

        for (const file of filesToMove) {
            const oldPath = path.join(subfolderPath, file);
            const newPath = path.join(albumPath, file);
            await fs.rename(oldPath, newPath);
            console.log(`Moved ${file} to ${albumPath}`);
        }

        await fs.rmdir(subfolderPath);
        console.log(`Removed empty directory: ${subfolderPath}`);

        res.json({ success: true, message: 'Successfully moved tracks and removed subfolder.' });

    } catch (error) {
        console.error(`[500] Error fixing subfolder for "${albumPath}":`, error);
        res.status(500).json({ error: 'Failed to fix subfolder. Please check server permissions and logs.' });
    }
});

app.post('/api/delete-files', async (req, res) => {
    const { filePaths } = req.body;
    if (!filePaths || !Array.isArray(filePaths)) {
        return res.status(400).json({ error: 'An array of file paths is required.' });
    }

    try {
        const deletionPromises = filePaths.map(filePath => fs.unlink(filePath));
        await Promise.all(deletionPromises);
        console.log(`Deleted ${filePaths.length} files.`);
        res.json({ success: true, message: 'Files deleted successfully.' });
    } catch (error) {
        console.error(`[500] Error deleting files:`, error);
        res.status(500).json({ error: 'Failed to delete files. Check server permissions.' });
    }
});

// --- Converter Endpoints ---
app.post('/api/convert/add', (req, res) => {
    console.log('[BACKEND] Received POST request on /api/convert/add');
    const { track, qualitySettings } = req.body;
    if (!track || !qualitySettings) {
        console.log('[BACKEND] Add failed: Missing track or qualitySettings.');
        return res.status(400).json({ error: 'Track and quality settings are required.' });
    }
    if (conversionQueue.some(item => item.path === track.path)) {
        console.log('[BACKEND] Add failed: Track already in queue.');
        return res.status(409).json({ message: 'Track is already in the queue.' });
    }
    
    const newQueueItem = {
        path: track.path,
        name: `${track.name}${track.extension}`,
        originalQuality: `${track.bitDepth}, ${track.sampleRate}`,
        targetQuality: `${qualitySettings.bitDepth}, ${qualitySettings.sampleRate}`,
        status: 'Pending',
        targetSettings: {
            format: qualitySettings.format,
            bitrate: qualitySettings.bitrate,
            bitDepth: qualitySettings.bitDepth,
            sampleRate: qualitySettings.sampleRate
        }
    };

    conversionQueue.push(newQueueItem);
    console.log(`[BACKEND] Added to queue. New queue size: ${conversionQueue.length}`);
    
    broadcast({ type: 'queue_update', queue: conversionQueue });
    res.status(200).json({ message: 'Track added to queue.' });
});

app.post('/api/convert/start', (req, res) => {
    console.log('[BACKEND] Received request to start conversion queue.');
    if (isConverting) {
        return res.status(400).json({ message: 'Conversion is already in progress.' });
    }
    processQueue();
    res.status(200).json({ message: 'Conversion queue started.' });
});

app.post('/api/convert/pause', (req, res) => {
    isPaused = !isPaused;
    console.log(`Conversion queue ${isPaused ? 'paused' : 'resumed'}.`);
    broadcast({ type: 'pause_update', isPaused: isPaused });
    
    // If resuming, try to process the next item
    if (!isPaused) {
        processQueue();
    }

    res.status(200).json({ message: `Queue ${isPaused ? 'paused' : 'resumed'}.` });
});

app.post('/api/convert/clear', (req, res) => {
    console.log('[BACKEND] Received request to clear completed items.');
    conversionQueue = conversionQueue.filter(item => item.status !== 'Complete' && item.status !== 'Error');
    broadcast({ type: 'queue_update', queue: conversionQueue });
    res.status(200).json({ message: 'Cleared completed items from queue.' });
});

// --- Start Server ---
server.listen(PORT, () => {
    console.log(`Server with WebSocket is running on http://localhost:${PORT}`);
});