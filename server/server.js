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

const allowedExtensions = ['.mp3', '.flac', '.alac', '.opus'];

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
                const artist = { name: artistDirent.name, path: artistPath, albums: [] };

                const albums = await fs.readdir(artistPath, { withFileTypes: true });
                await Promise.all(albums.map(async (albumDirent) => {
                    if (albumDirent.isDirectory()) {
                        const albumPath = path.join(artistPath, albumDirent.name);
                        const album = { title: albumDirent.name, path: albumPath, tracks: [] };

                        const direntsInAlbum = await fs.readdir(albumPath, { withFileTypes: true });
                        const trackDirents = direntsInAlbum.filter(d => d.isFile() && allowedExtensions.includes(path.extname(d.name).toLowerCase()));
                        
                        const trackPromises = trackDirents.map(async (trackDirent) => {
                            const trackPath = path.join(albumPath, trackDirent.name);
                            try {
                                const metadata = await mm.parseFile(trackPath);
                                const { bitrate, sampleRate } = metadata.format;
                                return {
                                    name: path.parse(trackDirent.name).name,
                                    extension: path.extname(trackDirent.name),
                                    path: trackPath,
                                    bitrate: bitrate ? `${Math.round(bitrate / 1000)} kbps` : 'N/A',
                                    bitDepth: metadata.format.bitsPerSample ? `${metadata.format.bitsPerSample}-bit` : 'N/A',
                                    sampleRate: sampleRate ? `${sampleRate / 1000} kHz` : 'N/A'
                                };
                            } catch (err) {
                                console.error(`Could not read metadata for ${trackPath}:`, err.message);
                                return null;
                            }
                        });
                        
                        const tracksWithMetadata = (await Promise.all(trackPromises)).filter(Boolean);
                        album.tracks = tracksWithMetadata;

                        if (album.tracks.length > 0) {
                            artist.albums.push(album);
                        }
                    }
                }));
                
                if (artist.albums.length > 0) {
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


// --- API Endpoints ---
// Browse endpoint
app.post('/api/browse', async (req, res) => {
    // If no path is provided, start at the user's home directory.
    // Use path.resolve to create a normalized, absolute path.
    const requestedPath = req.body.path || os.homedir();
    const currentPath = path.resolve(requestedPath);

    console.log(`Browsing request for: ${requestedPath}, resolved to: ${currentPath}`);

    try {
        const dirents = await fs.readdir(currentPath, { withFileTypes: true });
        const files = dirents
            .filter(dirent => dirent.isDirectory()) // Only process directories
            .map(dirent => ({
                name: dirent.name,
                type: 'directory',
                path: path.join(currentPath, dirent.name)
            }));

        files.sort((a, b) => a.name.localeCompare(b.name));

        res.json({
            path: currentPath,
            contents: files
        });

    } catch (error) {
        console.error(`[500] Error browsing path "${currentPath}":`, error);
        res.status(500).json({ error: `Could not read directory: ${currentPath}. Please check server permissions.` });
    }
});

// Scan endpoint
app.post('/api/scan', async (req, res) => {
    // Expecting a JSON body like: { "directory": "/path/to/music" }
    const { directory } = req.body;

    if (!directory || typeof directory !== 'string') {
        return res.status(400).json({ error: 'Please provide a single directory path as a string.' });
    }

    console.log('Received scan request for:', directory);
    
    try {
        // Scan the single provided directory
        const library = await scanDirectory(directory);
        res.json(library);
    } catch (error) {
        // The error from scanDirectory is already user-friendly
        res.status(500).json({ error: error.message });
    }
});

// Rename endpoint
app.post('/api/rename', async (req, res) => {
    console.log('--- RENAME REQUEST RECEIVED ---');
    const { oldPath, newName } = req.body;
    console.log('Request Body:', req.body);

    if (!oldPath || !newName) {
        console.log('Rename failed: Missing old path or new name.');
        return res.status(400).json({ error: 'Missing old path or new name.' });
    }

    if (/[\\/:"*?<>|]/.test(newName)) {
        console.log('Rename failed: New name contains invalid characters.');
        return res.status(400).json({ error: 'New name contains invalid characters.' });
    }

    const parentDirectory = path.dirname(oldPath);
    const newPath = path.join(parentDirectory, newName);

    console.log(`Attempting fs.rename from "${oldPath}" to "${newPath}"`);

    try {
        await fs.rename(oldPath, newPath);
        console.log('fs.rename SUCCEEDED.');
        res.json({ success: true, message: 'Renamed successfully.' });
    } catch (error) {
        console.error(`fs.rename FAILED. Error:`, error);
        res.status(500).json({ error: `Could not rename. Check permissions.` });
    }
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});