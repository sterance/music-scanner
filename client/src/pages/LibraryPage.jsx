import React, { useState, useMemo } from 'react';
import Artist from '../components/Artist';
import FilterBar from '../components/FilterBar';
import { compareTrackToTarget } from '../utils/quality';

function LibraryPage({ library, qualitySettings, libraryFilters, setLibraryFilters, handleScanAll }) {
    const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(true);

    const filteredLibrary = useMemo(() => {
        const filteredArtists = [];
        library.forEach(artist => {
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
                    if (newDisc.tracks.length > 0) { newAlbum.discs.push(newDisc); }
                });
                if (newAlbum.discs.length > 0) { newArtist.albums.push(newAlbum); }
            });
            if (newArtist.albums.length > 0) { filteredArtists.push(newArtist); }
        });
        return filteredArtists;
    }, [library, qualitySettings, libraryFilters]);

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
                <p>No music found. Go to Settings to add and scan a directory.</p>
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