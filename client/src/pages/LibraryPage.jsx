import React, { useState, useMemo } from 'react';
import Artist from '../components/Artist';
import FilterBar from '../components/FilterBar';
import { compareTrackToTarget } from '../utils/quality';

function LibraryPage({ directories, qualitySettings, libraryFilters, setLibraryFilters, handleScanAll }) {
    const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(true);

    const filteredLibrary = useMemo(() => {
        const artistMap = new Map();
        directories.forEach(dir => {
            if (dir.library && dir.library.length > 0) {
                dir.library.forEach(artist => {
                    const artistKey = artist.name.toLowerCase();
                    if (artistMap.has(artistKey)) {
                        const existingArtist = artistMap.get(artistKey);
                        const existingAlbumTitles = new Set(existingArtist.albums.map(a => a.title.toLowerCase()));
                        artist.albums.forEach(newAlbum => {
                            if (!existingAlbumTitles.has(newAlbum.title.toLowerCase())) { existingArtist.albums.push(newAlbum); }
                        });
                        existingArtist.albums.sort((a, b) => a.title.localeCompare(b.title));
                    } else {
                        artistMap.set(artistKey, structuredClone(artist));
                    }
                });
            }
        });
        
        const filteredArtists = [];
        Array.from(artistMap.values()).forEach(artist => {
            const newArtist = { ...artist, albums: [] };
            artist.albums.forEach(album => {
                const newAlbum = { ...album, discs: [] };
                album.discs.forEach(disc => {
                    const newDisc = { ...disc, tracks: [] };
                    disc.tracks.forEach(track => {
                        const comparison = compareTrackToTarget(track, qualitySettings);
                        if (libraryFilters[comparison]) {
                            newDisc.tracks.push(track);
                        }
                    });
                    if (newDisc.tracks.length > 0) {
                        newAlbum.discs.push(newDisc);
                    }
                });
                if (newAlbum.discs.length > 0) {
                    newArtist.albums.push(newAlbum);
                }
            });
            if (newArtist.albums.length > 0) {
                filteredArtists.push(newArtist);
            }
        });

        filteredArtists.sort((a, b) => a.name.localeCompare(b.name));
        return filteredArtists;
    }, [directories, qualitySettings, libraryFilters]);

    return (
        <>
            <header className="page-header">
                <h1>Library</h1>
            </header>
            
            <FilterBar 
                filters={libraryFilters}
                setFilters={setLibraryFilters}
                isCollapsed={isFiltersCollapsed}
                setIsCollapsed={setIsFiltersCollapsed}
            />

            {filteredLibrary.length === 0 ? (
                <p>No music found that matches your filter criteria. Try adjusting the filters or scanning a directory in Settings.</p>
            ) : (
                <div className="library-display">
                    {filteredLibrary.map((artist) => (
                        <Artist key={artist.path} artist={artist} onRenameSuccess={handleScanAll} />
                    ))}
                </div>
            )}
        </>
    );
}

export default LibraryPage;