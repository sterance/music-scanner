import React from 'react';

function FilterList({ label, items, selectedItems, onSelectionChange }) {
    const allSelected = selectedItems.length === 0;
    
    const handleAllClick = () => {
        onSelectionChange([]);
    };
    
    const handleItemClick = (item) => {
        if (selectedItems.includes(item)) {
            onSelectionChange(selectedItems.filter(i => i !== item));
        } else {
            onSelectionChange([...selectedItems, item]);
        }
    };
    
    return (
        <div className="filter-list-column">
            <h3 className="filter-list-label">{label}</h3>
            <div className="filter-list-items">
                <div 
                    className={`filter-list-item ${allSelected ? 'selected' : ''}`}
                    onClick={handleAllClick}
                >
                    <span className="filter-list-item-checkbox">
                        {allSelected && '✓'}
                    </span>
                    <span className="filter-list-item-text">All ({items.length} {label})</span>
                </div>
                {items.map(item => (
                    <div 
                        key={item}
                        className={`filter-list-item ${selectedItems.includes(item) ? 'selected' : ''}`}
                        onClick={() => handleItemClick(item)}
                    >
                        <span className="filter-list-item-checkbox">
                            {selectedItems.includes(item) && '✓'}
                        </span>
                        <span className="filter-list-item-text">{item}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default FilterList;

