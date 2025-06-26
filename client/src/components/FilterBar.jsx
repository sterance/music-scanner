import React from 'react';
import { ChevronRightIcon, CheckmarkIcon } from './Icons';

function FilterBar({ filters, setFilters, isCollapsed, setIsCollapsed }) {
    const handleFilterChange = (key) => {
        setFilters(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    return (
        <div className="filter-section">
            <div className="collapsible-header" onClick={() => setIsCollapsed(!isCollapsed)}>
                <ChevronRightIcon className={isCollapsed ? '' : 'expanded'} />
                <h2>Filters</h2>
            </div>
            {!isCollapsed && (
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
                           <CheckmarkIcon /> Target
                        </label>
                    </div>
                    <div className="filter-group">
                        <input type="checkbox" id="filter-above" className="filter-checkbox-input" checked={filters.above} onChange={() => handleFilterChange('above')} />
                        <label htmlFor="filter-above" className="filter-button-label">
                           <CheckmarkIcon /> Above Target
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FilterBar;