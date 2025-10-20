import React, { useState, useMemo } from 'react';
import LibraryTable from '../components/LibraryTable';
import FilterBar from '../components/FilterBar';
import { compareTrackToTarget } from '../utils/quality';

function LibraryPage({ library, qualitySettings, libraryFilters, setLibraryFilters, handleScanAll, handleAddToQueue, showWarnings }) {
    const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false);
    const [isArtistAlbumCollapsed, setIsArtistAlbumCollapsed] = useState(false);
    const [isMetadataCollapsed, setIsMetadataCollapsed] = useState(false);
    const [selectedArtists, setSelectedArtists] = useState([]);
    const [selectedAlbums, setSelectedAlbums] = useState([]);
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [selectedBitDepths, setSelectedBitDepths] = useState([]);
    const [selectedSampleRates, setSelectedSampleRates] = useState([]);

    const filteredTracks = useMemo(() => {
        if (!Array.isArray(library)) return [];
        return library.filter(track => {
            const comparison = compareTrackToTarget({ bitDepth: track.bitDepth, sampleRate: track.sampleRate, extension: track.extension }, qualitySettings);
            if (!libraryFilters[comparison]) return false;
            
            if (selectedArtists.length > 0 && !selectedArtists.includes(track.artist)) return false;
            if (selectedAlbums.length > 0 && !selectedAlbums.includes(track.album)) return false;
            if (selectedTypes.length > 0 && !selectedTypes.includes(track.extension)) return false;
            if (selectedBitDepths.length > 0 && !selectedBitDepths.includes(track.bitDepth)) return false;
            if (selectedSampleRates.length > 0 && !selectedSampleRates.includes(track.sampleRate)) return false;
            
            return true;
        });
    }, [library, qualitySettings, libraryFilters, selectedArtists, selectedAlbums, selectedTypes, selectedBitDepths, selectedSampleRates]);

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
                library={library}
                selectedArtists={selectedArtists}
                setSelectedArtists={setSelectedArtists}
                selectedAlbums={selectedAlbums}
                setSelectedAlbums={setSelectedAlbums}
                selectedTypes={selectedTypes}
                setSelectedTypes={setSelectedTypes}
                selectedBitDepths={selectedBitDepths}
                setSelectedBitDepths={setSelectedBitDepths}
                selectedSampleRates={selectedSampleRates}
                setSelectedSampleRates={setSelectedSampleRates}
                isArtistAlbumCollapsed={isArtistAlbumCollapsed}
                setIsArtistAlbumCollapsed={setIsArtistAlbumCollapsed}
                isMetadataCollapsed={isMetadataCollapsed}
                setIsMetadataCollapsed={setIsMetadataCollapsed}
            />
            {filteredTracks.length === 0 ? (
                <div className="library-display">
                    <p>No music found that matches your filter criteria. Try adjusting the filters or scanning a directory in Settings.</p>
                </div>
            ) : (
                <div className="library-display">
                    <LibraryTable tracks={filteredTracks} onAddToQueue={handleAddToQueue} />
                </div>
            )}
        </>
    );
}

export default LibraryPage;