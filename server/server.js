const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const cors = require('cors');
const mm = require('music-metadata');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const allowedExtensions = [
    '.dsf', '.dff', '.wav', '.aiff', '.aif', '.bwf', '.flac', 
    '.wv', '.ape', '.opus', '.ogg', '.oga', '.aac', '.mpc', 
    '.mp3', '.wma', '.mp2', '.spx', '.mka', '.mkv', '.webm', 
    '.mp4', '.m4a', '.asf'
];

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
                    const { bitrate, sampleRate } = metadata.format;
                    tracks.push({
                        name: path.parse(dirent.name).name,
                        extension: path.extname(dirent.name),
                        path: fullPath,
                        bitrate: bitrate ? `${Math.round(bitrate / 1000)} kbps` : 'N/A',
                        bitDepth: metadata.format.bitsPerSample ? `${metadata.format.bitsPerSample}-bit` : 'N/A',
                        sampleRate: sampleRate ? `${sampleRate / 1000} kHz` : 'N/A'
                    });
                } catch (err) {
                    console.error(`Could not read metadata for ${fullPath}:`, err.message);
                    otherFiles.push({ name: dirent.name, path: fullPath, reason: 'Could not read metadata.' });
                }
            } else {
                otherFiles.push({ name: dirent.name, path: fullPath, reason: 'Unsupported file type.' });
            }
        }
    }
    return { tracks, otherFiles };
};

async function scanDirectory(musicPath) {
    console.log(`Scanning directory: ${musicPath}`);
    const library = [];
    try {
        const stats = await fs.stat(musicPath);
        if (!stats.isDirectory()) throw new Error('Provided path is not a directory.');

        const artists = await fs.readdir(musicPath, { withFileTypes: true });
        await Promise.all(artists.map(async (artistDirent) => {
            if (artistDirent.isDirectory()) {
                const artistPath = path.join(musicPath, artistDirent.name);
                const artist = { name: artistDirent.name, path: artistPath, albums: [], unexpectedItems: [] };

                const artistContents = await fs.readdir(artistPath, { withFileTypes: true });

                // Check for unexpected files in the artist folder
                artistContents.forEach(item => {
                    if (item.isFile()) {
                        artist.unexpectedItems.push({ name: item.name, path: path.join(artistPath, item.name), reason: 'File found in artist directory.' });
                    }
                });

                const albums = artistContents.filter(d => d.isDirectory());
                await Promise.all(albums.map(async (albumDirent) => {
                    const albumPath = path.join(artistPath, albumDirent.name);
                    const album = { title: albumDirent.name, path: albumPath, discs: [], unexpectedItems: [] };
                    
                    const albumContents = await fs.readdir(albumPath, { withFileTypes: true });

                    // Check for tracks directly in the album folder
                    const rootScan = await getTracksInDir(albumPath);
                    if (rootScan.tracks.length > 0) {
                        album.discs.push({ name: album.title, path: album.path, isRoot: true, tracks: rootScan.tracks });
                    }
                    // Add any non-track files to the unexpected list
                    album.unexpectedItems.push(...rootScan.otherFiles.map(f => ({ ...f, reason: 'Unsupported file in album directory.' })));

                    const discFolders = albumContents.filter(d => d.isDirectory());
                    for (const discFolder of discFolders) {
                        const discPath = path.join(albumPath, discFolder.name);
                        const discContents = await fs.readdir(discPath, { withFileTypes: true });

                        // Check for nested subfolders (which are invalid)
                        const nestedFolders = discContents.filter(d => d.isDirectory());
                        if (nestedFolders.length > 0) {
                            album.unexpectedItems.push({ name: discFolder.name, path: discPath, reason: 'Contains nested subdirectories.' });
                            continue; // Skip processing this folder further
                        }

                        // Scan for tracks in the disc folder
                        const discScan = await getTracksInDir(discPath);
                        if (discScan.tracks.length > 0) {
                            album.discs.push({ name: discFolder.name, path: discPath, isRoot: false, tracks: discScan.tracks });
                        }
                        // Add any non-track files to the unexpected list
                        album.unexpectedItems.push(...discScan.otherFiles.map(f => ({ ...f, reason: `Unsupported file in disc directory: ${discFolder.name}` })));
                    }

                    if (album.discs.length > 0 || album.unexpectedItems.length > 0) {
                        artist.albums.push(album);
                    }
                }));
                
                if (artist.albums.length > 0 || artist.unexpectedItems.length > 0) {
                    library.push(artist);
                }
            }
        }));
    } catch (error) {
        console.error(`Error scanning path ${musicPath}:`, error.message);
        throw new Error(`Failed to scan ${musicPath}. Please check path and permissions.`);
    }
    
    library.sort((a, b) => a.name.localeCompare(b.name));
    library.forEach(artist => artist.albums.sort((a, b) => a.title.localeCompare(b.title)));
    return library;
}

// API Endpoints
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
    const { directory } = req.body;
    if (!directory || typeof directory !== 'string') { return res.status(400).json({ error: 'Please provide a single directory path as a string.' }); }
    try {
        const library = await scanDirectory(directory);
        res.json(library);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});