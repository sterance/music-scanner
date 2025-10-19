import React from 'react';

function Sidebar({ currentPage, setCurrentPage, isCollapsed, setIsCollapsed }) {
    return (
        <nav className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <button 
                    className="sidebar-toggle"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <div className="hamburger">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </button>
                {!isCollapsed && <h2 className="sidebar-title">Music Scanner</h2>}
            </div>
            <ul className="sidebar-nav">
                <li>
                    <button 
                        className={`sidebar-button ${currentPage === 'library' ? 'active' : ''}`}
                        onClick={() => setCurrentPage('library')}
                        title="Library"
                    >
                        <svg className="sidebar-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/>
                        </svg>
                        {!isCollapsed && <span>Library</span>}
                    </button>
                </li>
                <li>
                    <button 
                        className={`sidebar-button ${currentPage === 'converter' ? 'active' : ''}`}
                        onClick={() => setCurrentPage('converter')}
                        title="Converter"
                    >
                        <svg className="sidebar-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        {!isCollapsed && <span>Converter</span>}
                    </button>
                </li>
                <li>
                    <button 
                        className={`sidebar-button ${currentPage === 'settings' ? 'active' : ''}`}
                        onClick={() => setCurrentPage('settings')}
                        title="Settings"
                    >
                        <svg className="sidebar-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                        </svg>
                        {!isCollapsed && <span>Settings</span>}
                    </button>
                </li>
            </ul>
        </nav>
    );
}

export default Sidebar;