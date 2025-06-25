import React, { useMemo } from 'react';
import Artist from '../components/Artist';

function LibraryPage({ directories, handleScanAll }) {

    const combinedLibrary = useMemo(() => {
        const artistMap = new Map();
        directories.forEach(dir => {
            if (dir.library && dir.library.length > 0) {
                dir.library.forEach(artist => {
                    const artistKey = artist.name.toLowerCase();
                    if (artistMap.has(artistKey)) {
                        const existingArtist = artistMap.get(artistKey);
                        const existingAlbumTitles = new Set(existingArtist.albums.map(a => a.title.toLowerCase()));
                        artist.albums.forEach(newAlbum => {
                            if (!existingAlbumTitles.has(newAlbum.title.toLowerCase())) {
                                existingArtist.albums.push(newAlbum);
                            }
                        });
                        existingArtist.albums.sort((a, b) => a.title.localeCompare(b.title));
                    } else {
                        artistMap.set(artistKey, structuredClone(artist));
                    }
                });
            }
        });
        const sortedArtists = Array.from(artistMap.values());
        sortedArtists.sort((a, b) => a.name.localeCompare(b.name));
        return sortedArtists;
    }, [directories]);

    return (
        <>
            <header className="page-header">
                <h1>Library</h1>
            </header>
            
            {combinedLibrary.length === 0 ? (
                <p>No music found. Go to the Settings page to add and scan a directory.</p>
            ) : (
                <div className="library-display">
                    {combinedLibrary.map((artist) => (
                        <Artist 
                            key={artist.path} 
                            artist={artist}
                            onRenameSuccess={handleScanAll} 
                        />
                    ))}
                </div>
            )}
        </>
    );
}

export default LibraryPage;