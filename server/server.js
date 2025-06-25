const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const cors = require('cors');

const app = express();
const PORT = 3001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

const allowedExtensions = ['.mp3', '.flac', '.alac', '.opus'];

async function scanDirectory(musicPath) {
    console.log(`Scanning directory: ${musicPath}`);
    const library = [];

    try {
        // Check if the provided path exists and is a directory
        const stats = await fs.stat(musicPath);
        if (!stats.isDirectory()) {
            throw new Error('Provided path is not a directory.');
        }

        const artists = await fs.readdir(musicPath, { withFileTypes: true });

        // Using Promise.all to process all artists in parallel
        await Promise.all(artists.map(async (artistDirent) => {
            if (artistDirent.isDirectory()) {
                const artistName = artistDirent.name;
                const artistPath = path.join(musicPath, artistName);
                const artist = { name: artistName, albums: [] };

                const albums = await fs.readdir(artistPath, { withFileTypes: true });
                await Promise.all(albums.map(async (albumDirent) => {
                    if (albumDirent.isDirectory()) {
                        const albumTitle = albumDirent.name;
                        const albumPath = path.join(artistPath, albumTitle);
                        const album = { title: albumTitle, tracks: [] };

                        const allDirentsInAlbum = await fs.readdir(albumPath, { withFileTypes: true });
                        
                        const tracks = allDirentsInAlbum
                            .filter(trackDirent => 
                                trackDirent.isFile() && allowedExtensions.includes(path.extname(trackDirent.name).toLowerCase())
                            )
                            .map(trackDirent => trackDirent.name);

                        album.tracks = tracks;

                        if (album.tracks.length > 0) {
                            artist.albums.push(album);
                        }
                    }
                }));
                
                // Only add artists that contain albums
                if (artist.albums.length > 0) {
                    library.push(artist);
                }
            }
        }));

    } catch (error) {
        console.error(`Error scanning path ${musicPath}:`, error.message);
        throw new Error(`Failed to scan ${musicPath}. Please check path and permissions.`);
    }
    
    // Sort artists and albums alphabetically
    library.sort((a, b) => a.name.localeCompare(b.name));
    library.forEach(artist => {
        artist.albums.sort((a, b) => a.title.localeCompare(b.title));
    });

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
    const { oldPath, newName } = req.body;

    if (!oldPath || !newName) {
        return res.status(400).json({ error: 'Missing old path or new name.' });
    }

    // Basic security check to prevent invalid characters
    if (/[\\/:"*?<>|]/.test(newName)) {
        return res.status(400).json({ error: 'New name contains invalid characters.' });
    }

    const parentDirectory = path.dirname(oldPath);
    const newPath = path.join(parentDirectory, newName);

    console.log(`Rename request: from "${oldPath}" to "${newPath}"`);

    try {
        await fs.rename(oldPath, newPath);
        res.json({ success: true, message: 'Directory renamed successfully.' });
    } catch (error) {
        console.error(`[500] Error renaming path:`, error);
        res.status(500).json({ error: `Could not rename. Check permissions and if the directory is in use.` });
    }
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});