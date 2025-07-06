const express = require('express');
const path = require('path');
const os = require('os');
const cors = require('cors');
const mm = require('music-metadata');
const fs = require('fs').promises;
const db = require('./database');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

db.initializeDatabase();

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

// --- API Endpoints ---

app.get('/api/directories', async (req, res) => { try { res.json(await db.getDirectoriesOnly()); } catch (e) { res.status(500).json({ error: 'Failed to fetch directories.' }); } });
app.get('/api/library', async (req, res) => { try { res.json(await db.getFullLibrary()); } catch (e) { res.status(500).json({ error: 'Failed to fetch library.' }); } });
app.post('/api/directories', async (req, res) => { try { res.status(201).json(await db.addDirectory(req.body.path)); } catch (e) { res.status(500).json({ error: 'Failed to add directory.' }); } });
app.delete('/api/directories/:id', async (req, res) => { try { await db.removeDirectory(req.params.id); res.status(204).send(); } catch (e) { res.status(500).json({ error: 'Failed to remove directory.' }); } });

app.post('/api/rename', async (req, res) => {
    const { oldPath, newName } = req.body;
    if (!oldPath || !newName) { return res.status(400).json({ error: 'Missing old path or new name.' }); }
    if (/[\\/:"*?<>|]/.test(newName)) { return res.status(400).json({ error: 'New name contains invalid characters.' }); }
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

        const artistDirents = await fs.readdir(musicPath, { withFileTypes: true });
        for (const artistDirent of artistDirents) {
            if (!artistDirent.isDirectory()) continue;

            const artistPath = path.join(musicPath, artistDirent.name);
            // Build a complete artist object in memory first
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
            
            // Now that the full artist object is built, insert it into the database
            if (artistData.albums.length > 0 || artistData.unexpectedItems.length > 0) {
                const artistId = await db.insertArtist(artistData, directoryId);
                for (const album of artistData.albums) {
                    const albumId = await db.insertAlbum(album, artistId);
                    for (const disc of album.discs) {
                        const discId = await db.insertDisc(disc, albumId);
                        for (const track of disc.tracks) {
                            await db.insertTrack(track, discId);
                        }
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

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});