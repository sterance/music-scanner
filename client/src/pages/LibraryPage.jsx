import React, { useState, useMemo } from 'react';
import LibraryTable from '../components/LibraryTable';
import FilterBar from '../components/FilterBar';
import { compareTrackToTarget } from '../utils/quality';

function LibraryPage({ library, qualitySettings, libraryFilters, setLibraryFilters, handleScanAll, handleAddToQueue, showWarnings }) {
    const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(true);

    const filteredTracks = useMemo(() => {
        if (!Array.isArray(library)) return [];
        return library.filter(track => {
            const comparison = compareTrackToTarget({ bitDepth: track.bitDepth, sampleRate: track.sampleRate, extension: track.extension }, qualitySettings);
            return libraryFilters[comparison];
        });
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