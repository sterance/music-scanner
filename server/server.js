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
const server = http.createServer(app); // Create an HTTP server from the Express app
const wss = new WebSocket.Server({ server }); // Attach the WebSocket server
const PORT = 3001;

// Tell fluent-ffmpeg where to find the binary provided by ffmpeg-static
ffmpeg.setFfmpegPath(ffmpegStatic);

app.use(cors());
app.use(express.json());
db.initializeDatabase();

// --- In-Memory Conversion Queue & State ---
let conversionQueue = [];
let isConverting = false;

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
    return { tracks, otherFiles };
};

async function scanDirectory(musicPath) {
    const library = [];
    const artistDirents = await fs.readdir(musicPath, { withFileTypes: true });
    for (const artistDirent of artistDirents) {
        if (!artistDirent.isDirectory()) continue;

        const artistPath = path.join(musicPath, artistDirent.name);
        const artistData = {
            name: artistDirent.name,
            path: artistPath,
            unexpectedItems: [],
            albums: []
        };

        const artistContents = await fs.readdir(artistPath, { withFileTypes: true });
        artistContents.forEach(item => {
            if (item.isFile()) {
                artistData.unexpectedItems.push({ name: item.name, path: path.join(artistPath, item.name), reason: 'File in artist directory.' });
            }
        });

        const albumDirents = artistContents.filter(d => d.isDirectory());
        for (const albumDirent of albumDirents) {
            const albumPath = path.join(artistPath, albumDirent.name);
            const albumData = {
                title: albumDirent.name,
                path: albumPath,
                unexpectedItems: [],
                discs: []
            };

            const albumContents = await fs.readdir(albumPath, { withFileTypes: true });
            const rootScan = await getTracksInDir(albumPath);
            if (rootScan.tracks.length > 0) {
                albumData.discs.push({ name: albumData.title, path: albumData.path, isRoot: true, tracks: rootScan.tracks });
            }
            albumData.unexpectedItems.push(...rootScan.otherFiles.map(f => ({ ...f, reason: 'Unsupported file in album directory.' })));

            const discFolders = albumContents.filter(d => d.isDirectory());
            for (const discFolder of discFolders) {
                const discPath = path.join(albumPath, discFolder.name);
                const discContents = await fs.readdir(discPath, { withFileTypes: true });
                if (discContents.some(d => d.isDirectory())) {
                    albumData.unexpectedItems.push({ name: discFolder.name, path: discPath, reason: 'Contains nested subdirectories.' });
                    continue;
                }
                const discScan = await getTracksInDir(discPath);
                if (discScan.tracks.length > 0) {
                    albumData.discs.push({ name: discFolder.name, path: discPath, isRoot: false, tracks: discScan.tracks });
                }
                albumData.unexpectedItems.push(...discScan.otherFiles.map(f => ({ ...f, reason: `Unsupported file in disc folder: ${discFolder.name}` })));
            }
            
            if (albumData.discs.length > 0 || albumData.unexpectedItems.length > 0) {
                artistData.albums.push(albumData);
            }
        }
        
        if (artistData.albums.length > 0 || artistData.unexpectedItems.length > 0) {
            library.push(artistData);
        }
    }
    return library;
}

// --- Conversion Logic ---
async function processQueue() {
    if (isConverting) return;
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

            // UPDATED: New comprehensive codec map
            const codecMap = {
                'FLAC': 'flac',
                'ALAC': 'alac',
                'WAV': 'pcm_s16le', // Default, might be overridden by bit depth
                'AIFF': 'pcm_s16be', // Default, might be overridden by bit depth
                'Opus': 'libopus',
                'Vorbis': 'libvorbis',
                'AAC': 'aac',
                'MP3': 'libmp3lame',
            };
            
            let targetCodec = codecMap[format];
            const targetBitDepth = parseInt(bitDepth, 10);

            // Dynamically change codec for WAV/AIFF based on bit depth
            if (format === 'WAV') {
                if (targetBitDepth === 24) targetCodec = 'pcm_s24le';
            } else if (format === 'AIFF') {
                if (targetBitDepth === 24) targetCodec = 'pcm_s24be';
            }

            if (targetCodec) {
                command.audioCodec(targetCodec);
            }

            const targetBitrate = parseInt(bitrate, 10);
            if (['libmp3lame', 'aac', 'libopus', 'libvorbis'].includes(targetCodec)) {
                if (!isNaN(targetBitrate)) {
                    command.audioBitrate(`${targetBitrate}k`);
                }
            }

            const targetSampleRate = parseFloat(sampleRate) * 1000;
            if (!isNaN(targetSampleRate)) {
                command.audioFrequency(targetSampleRate);
            }

            command
                .on('progress', (progress) => {
                    const percent = progress.percent ? progress.percent.toFixed(2) : 0;
                    broadcast({ type: 'progress', path: job.path, percent });
                })
                .on('end', () => { job.status = 'Complete'; broadcast({ type: 'status_update', path: job.path, status: 'Complete' }); resolve(); })
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

app.get('/api/directories', async (req, res) => {
    try {
        const directories = await db.getDirectoriesOnly();
        res.json(directories);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch directories.' });
    }
});

app.get('/api/library', async (req, res) => {
    try {
        const library = await db.getFullLibrary();
        res.json(library);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch library.' });
    }
});

app.post('/api/directories', async (req, res) => {
    try {
        const newDirectory = await db.addDirectory(req.body.path);
        res.status(201).json(newDirectory);
    } catch (e) {
        res.status(500).json({ error: 'Failed to add directory.' });
    }
});

app.delete('/api/directories/:id', async (req, res) => {
    try {
        await db.removeDirectory(req.params.id);
        res.status(204).send();
    } catch (e) {
        res.status(500).json({ error: 'Failed to remove directory.' });
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
    const { directoryId, path: musicPath } = req.body;
    if (!directoryId || !musicPath) return res.status(400).json({ error: 'Directory ID and path are required.' });

    try {
        await db.clearDirectoryData(directoryId);
        
        const libraryData = await scanDirectory(musicPath);

        for (const artist of libraryData) {
            const artistId = await db.insertArtist(artist, directoryId);
            for (const album of artist.albums) {
                const albumId = await db.insertAlbum(album, artistId);
                for (const disc of album.discs) {
                    const discId = await db.insertDisc(disc, albumId);
                    for (const track of disc.tracks) {
                        await db.insertTrack(track, discId);
                    }
                }
            }
        }
        
        const updatedLibrary = await db.getFullLibrary();
        res.json(updatedLibrary);

    } catch (error) {
        console.error("Scan failed with error:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- Converter Endpoints ---
app.post('/api/convert/add', (req, res) => {
    const { track, qualitySettings } = req.body;
    if (!track || !qualitySettings) {
        return res.status(400).json({ error: 'Track and quality settings are required.' });
    }
    if (conversionQueue.some(item => item.path === track.path)) {
        return res.status(409).json({ message: 'Track is already in the queue.' });
    }
    conversionQueue.push({
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
    });
    broadcast({ type: 'queue_update', queue: conversionQueue });
    res.status(200).json({ message: 'Track added to queue.' });
});

app.post('/api/convert/start', (req, res) => {
    if (isConverting) {
        return res.status(400).json({ message: 'Conversion is already in progress.' });
    }
    processQueue();
    res.status(200).json({ message: 'Conversion queue started.' });
});

app.post('/api/convert/clear', (req, res) => {
    conversionQueue = conversionQueue.filter(item => item.status !== 'Complete' && item.status !== 'Error');
    broadcast({ type: 'queue_update', queue: conversionQueue });
    res.status(200).json({ message: 'Cleared completed items from queue.' });
});

// --- Start Server ---
server.listen(PORT, () => {
    console.log(`Server with WebSocket is running on http://localhost:${PORT}`);
});