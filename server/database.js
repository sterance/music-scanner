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
            CREATE TABLE IF NOT EXISTS library (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                track_name TEXT NOT NULL,
                album TEXT,
                disc TEXT,
                artist TEXT,
                extension TEXT,
                bit_depth TEXT,
                sample_rate TEXT,
                path TEXT NOT NULL UNIQUE
            );

            CREATE TABLE IF NOT EXISTS converted_files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                track_name TEXT NOT NULL,
                album TEXT,
                disc TEXT,
                artist TEXT,
                extension TEXT,
                bit_depth TEXT,
                sample_rate TEXT,
                path TEXT NOT NULL UNIQUE,
                conversion_date DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('Database tables are ready.');
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

async function getLibrary() {
    return db.all(`
        SELECT 
            track_name AS trackName,
            album,
            disc,
            artist,
            extension,
            bit_depth AS bitDepth,
            sample_rate AS sampleRate,
            path
        FROM library
        ORDER BY artist COLLATE NOCASE, album COLLATE NOCASE, disc COLLATE NOCASE, track_name COLLATE NOCASE
    `);
}

async function clearLibrary() { return db.run('DELETE FROM library'); }
async function clearConverted() { return db.run('DELETE FROM converted_files'); }

async function insertTrackFlat(track) {
    return db.run(
        'INSERT OR IGNORE INTO library (track_name, album, disc, artist, extension, bit_depth, sample_rate, path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [track.trackName, track.album, track.disc, track.artist, track.extension, track.bitDepth, track.sampleRate, track.path]
    );
}

async function insertConvertedFlat(track) {
    return db.run(
        'INSERT OR IGNORE INTO converted_files (track_name, album, disc, artist, extension, bit_depth, sample_rate, path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [track.trackName, track.album, track.disc, track.artist, track.extension, track.bitDepth, track.sampleRate, track.path]
    );
}

module.exports = {
    initializeDatabase,
    getLibrary,
    clearLibrary,
    clearConverted,
    insertTrackFlat,
    insertConvertedFlat
};