import React from 'react';

function Sidebar({ currentPage, setCurrentPage }) {
    return (
        <nav className="sidebar">
            <ul>
                <li>
                    <button 
                        className={`sidebar-button ${currentPage === 'library' ? 'active' : ''}`}
                        onClick={() => setCurrentPage('library')}
                    >
                        Library
                    </button>
                </li>
                <li>
                    <button 
                        className={`sidebar-button ${currentPage === 'settings' ? 'active' : ''}`}
                        onClick={() => setCurrentPage('settings')}
                    >
                        Settings
                    </button>
                </li>
            </ul>
        </nav>
    );
}

export default Sidebar;