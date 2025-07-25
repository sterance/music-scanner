const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

let db;

async function initializeDatabase() {
    try {
        db = await open({
            filename: './library.db',
            driver: sqlite3.Database
        });
        console.log('Successfully connected to the SQLite database.');
        await db.exec('PRAGMA foreign_keys = ON;');

        await db.exec(`
            CREATE TABLE IF NOT EXISTS directories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                path TEXT NOT NULL UNIQUE
            );
            
            CREATE TABLE IF NOT EXISTS artists (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                path TEXT NOT NULL UNIQUE,
                directory_id INTEGER NOT NULL,
                unexpected_items TEXT,
                FOREIGN KEY (directory_id) REFERENCES directories (id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS albums (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                path TEXT NOT NULL UNIQUE,
                artist_id INTEGER NOT NULL,
                unexpected_items TEXT,
                FOREIGN KEY (artist_id) REFERENCES artists (id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS discs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                path TEXT NOT NULL,
                is_root INTEGER NOT NULL DEFAULT 0,
                album_id INTEGER NOT NULL,
                FOREIGN KEY (album_id) REFERENCES albums (id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS tracks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                path TEXT NOT NULL UNIQUE,
                extension TEXT,
                bitDepth TEXT,
                sampleRate TEXT,
                bitrate TEXT,
                disc_id INTEGER NOT NULL,
                FOREIGN KEY (disc_id) REFERENCES discs (id) ON DELETE CASCADE
            );

            /* --- THIS IS THE MISSING TABLE CREATION --- */
            CREATE TABLE IF NOT EXISTS converted_files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                original_path TEXT NOT NULL UNIQUE,
                converted_path TEXT NOT NULL,
                original_track_id INTEGER,
                conversion_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (original_track_id) REFERENCES tracks (id) ON DELETE CASCADE
            );
        `);
        console.log('Database relational tables are ready.');
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

async function getFullLibrary() {
    const artists = await db.all(`
        SELECT id, name, path, unexpected_items FROM artists ORDER BY name COLLATE NOCASE
    `);
    for (const artist of artists) {
        artist.unexpectedItems = artist.unexpected_items ? JSON.parse(artist.unexpected_items) : [];
        artist.albums = await db.all(`
            SELECT id, title, path, unexpected_items FROM albums WHERE artist_id = ? ORDER BY title COLLATE NOCASE
        `, artist.id);
        for (const album of artist.albums) {
            album.unexpectedItems = album.unexpected_items ? JSON.parse(album.unexpected_items) : [];
            album.discs = await db.all(`
                SELECT id, name, path, is_root as isRoot FROM discs WHERE album_id = ?
            `, album.id);
            for (const disc of album.discs) {
                disc.tracks = await db.all('SELECT * FROM tracks WHERE disc_id = ?', disc.id);
            }
        }
    }
    return artists;
}

async function getDirectoriesOnly() { return db.all('SELECT id, path FROM directories'); }
async function addDirectory(path) {
    await db.run('INSERT OR IGNORE INTO directories (path) VALUES (?)', path);
    return db.get('SELECT id, path FROM directories WHERE path = ?', path);
}
async function removeDirectory(id) { return db.run('DELETE FROM directories WHERE id = ?', id); }
async function clearDirectoryData(directoryId) { return db.run('DELETE FROM artists WHERE directory_id = ?', directoryId); }

async function insertArtist(artist, directoryId) {
    const result = await db.run('INSERT INTO artists (name, path, directory_id, unexpected_items) VALUES (?, ?, ?, ?)', [artist.name, artist.path, directoryId, JSON.stringify(artist.unexpectedItems)]);
    return result.lastID;
}
async function insertAlbum(album, artistId) {
    const result = await db.run('INSERT INTO albums (title, path, artist_id, unexpected_items) VALUES (?, ?, ?, ?)', [album.title, album.path, artistId, JSON.stringify(album.unexpectedItems)]);
    return result.lastID;
}
async function insertDisc(disc, albumId) {
    const result = await db.run('INSERT INTO discs (name, path, is_root, album_id) VALUES (?, ?, ?, ?)', [disc.name, disc.path, disc.isRoot ? 1 : 0, albumId]);
    return result.lastID;
}
async function insertTrack(track, discId) {
    // Using INSERT OR IGNORE to prevent crashes if a track path somehow already exists
    await db.run('INSERT OR IGNORE INTO tracks (name, path, extension, bitDepth, sampleRate, bitrate, disc_id) VALUES (?, ?, ?, ?, ?, ?, ?)', [track.name, track.path, track.extension, track.bitDepth, track.sampleRate, track.bitrate, discId]);
}

async function insertConvertedFile(originalPath, convertedPath) {
    // Find the ID of the original track
    const originalTrack = await db.get('SELECT id FROM tracks WHERE path = ?', originalPath);
    if (originalTrack) {
        return db.run(
            'INSERT OR REPLACE INTO converted_files (original_path, converted_path, original_track_id) VALUES (?, ?, ?)',
            [originalPath, convertedPath, originalTrack.id]
        );
    } else {
        // If the original track isn't in the DB for some reason, we still record the conversion without a link
        return db.run(
            'INSERT OR REPLACE INTO converted_files (original_path, converted_path) VALUES (?, ?)',
            [originalPath, convertedPath]
        );
    }
}

module.exports = {
    initializeDatabase,
    getFullLibrary,
    getDirectoriesOnly,
    addDirectory,
    removeDirectory,
    clearDirectoryData,
    insertArtist,
    insertAlbum,
    insertDisc,
    insertTrack,
    insertConvertedFile
};