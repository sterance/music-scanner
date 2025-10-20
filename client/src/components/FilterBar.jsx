import React, { useMemo } from 'react';
import { ChevronRightIcon, CheckmarkIcon } from './Icons';
import FilterList from './FilterList';

function FilterBar({ 
    filters, 
    setFilters, 
    isCollapsed, 
    setIsCollapsed,
    library,
    selectedArtists,
    setSelectedArtists,
    selectedAlbums,
    setSelectedAlbums,
    selectedTypes,
    setSelectedTypes,
    selectedBitDepths,
    setSelectedBitDepths,
    selectedSampleRates,
    setSelectedSampleRates,
    isArtistAlbumCollapsed,
    setIsArtistAlbumCollapsed,
    isMetadataCollapsed,
    setIsMetadataCollapsed
}) {
    const handleFilterChange = (key) => {
        setFilters(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const { artists, albums, types, bitDepths, sampleRates } = useMemo(() => {
        if (!Array.isArray(library)) return { artists: [], albums: [], types: [], bitDepths: [], sampleRates: [] };
        
        const artistSet = new Set();
        const albumSet = new Set();
        const typeSet = new Set();
        const bitDepthSet = new Set();
        const sampleRateSet = new Set();
        
        library.forEach(track => {
            if (track.artist) artistSet.add(track.artist);
            if (track.album) albumSet.add(track.album);
            if (track.extension) typeSet.add(track.extension);
            if (track.bitDepth) bitDepthSet.add(track.bitDepth);
            if (track.sampleRate) sampleRateSet.add(track.sampleRate);
        });
        
        return {
            artists: Array.from(artistSet).sort(),
            albums: Array.from(albumSet).sort(),
            types: Array.from(typeSet).sort(),
            bitDepths: Array.from(bitDepthSet).sort(),
            sampleRates: Array.from(sampleRateSet).sort()
        };
    }, [library]);

    const availableAlbums = useMemo(() => {
        if (selectedArtists.length === 0) return albums;
        
        const albumSet = new Set();
        library.forEach(track => {
            if (selectedArtists.includes(track.artist) && track.album) {
                albumSet.add(track.album);
            }
        });
        return Array.from(albumSet).sort();
    }, [library, selectedArtists, albums]);

    return (
        <div className="filter-section">
            <div className="collapsible-header" onClick={() => setIsCollapsed(!isCollapsed)}>
                <ChevronRightIcon className={isCollapsed ? '' : 'expanded'} />
                <h2>Filters</h2>
            </div>
            {!isCollapsed && (
                <div className="filter-subsections">
                    <div className="filter-subsection">
                        <div className="filter-subsection-header" onClick={() => setIsArtistAlbumCollapsed(!isArtistAlbumCollapsed)}>
                            <ChevronRightIcon className={isArtistAlbumCollapsed ? '' : 'expanded'} />
                            <h3>Artist & Album</h3>
                        </div>
                        {!isArtistAlbumCollapsed && (
                            <div className="filter-list-section">
                                <FilterList 
                                    label="Artist"
                                    items={artists}
                                    selectedItems={selectedArtists}
                                    onSelectionChange={setSelectedArtists}
                                />
                                <FilterList 
                                    label="Album"
                                    items={availableAlbums}
                                    selectedItems={selectedAlbums}
                                    onSelectionChange={setSelectedAlbums}
                                />
                            </div>
                        )}
                    </div>

                    <div className="filter-subsection">
                        <div className="filter-subsection-header" onClick={() => setIsMetadataCollapsed(!isMetadataCollapsed)}>
                            <ChevronRightIcon className={isMetadataCollapsed ? '' : 'expanded'} />
                            <h3>Quality</h3>
                        </div>
                        {!isMetadataCollapsed && (
                            <div className="filter-list-section filter-list-section-triple">
                                <FilterList 
                                    label="Type"
                                    items={types}
                                    selectedItems={selectedTypes}
                                    onSelectionChange={setSelectedTypes}
                                />
                                <FilterList 
                                    label="Bit Depth"
                                    items={bitDepths}
                                    selectedItems={selectedBitDepths}
                                    onSelectionChange={setSelectedBitDepths}
                                />
                                <FilterList 
                                    label="Sample Rate"
                                    items={sampleRates}
                                    selectedItems={selectedSampleRates}
                                    onSelectionChange={setSelectedSampleRates}
                                />
                            </div>
                        )}
                    </div>

                    <div className="filter-subsection">
                        <div className="filter-options">
                            <div className="filter-group">
                                <input type="checkbox" id="filter-below" className="filter-checkbox-input" checked={filters.below} onChange={() => handleFilterChange('below')} />
                                <label htmlFor="filter-below" className="filter-button-label">
                                    <CheckmarkIcon /> Below Target
                                </label>
                            </div>
                            <div className="filter-group">
                                <input type="checkbox" id="filter-target" className="filter-checkbox-input" checked={filters.target} onChange={() => handleFilterChange('target')} />
                                <label htmlFor="filter-target" className="filter-button-label">
                                   <CheckmarkIcon /> At Target
                                </label>
                            </div>
                            <div className="filter-group">
                                <input type="checkbox" id="filter-above" className="filter-checkbox-input" checked={filters.above} onChange={() => handleFilterChange('above')} />
                                <label htmlFor="filter-above" className="filter-button-label">
                                   <CheckmarkIcon /> Above Target
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FilterBar;