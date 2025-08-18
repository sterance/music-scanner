import React, { useState } from 'react';
import QualitySettings from '../components/QualitySettings';
import DirectorySettings from '../components/DirectorySettings';
import ViewSettings from '../components/ViewSettings';
import { ChevronRightIcon } from '../components/Icons';

function SettingsPage({ 
    directories, handleAddDirectory, handleRemoveDirectory, handleScan,
    qualitySettings, setQualitySettings, viewSettings, setViewSettings
}) {
    
    const [isDirectoriesCollapsed, setIsDirectoriesCollapsed] = useState(true);
    const [isQualityCollapsed, setIsQualityCollapsed] = useState(true);
    const [isViewCollapsed, setIsViewCollapsed] = useState(true);

    return (
        <>
            <header className="page-header">
                <h1>Settings</h1>
            </header>

            <div className="settings-section">
                <div className="collapsible-header" onClick={() => setIsDirectoriesCollapsed(!isDirectoriesCollapsed)}>
                    <ChevronRightIcon className={isDirectoriesCollapsed ? '' : 'expanded'} />
                    <h2>Library Directories</h2>
                </div>

                {!isDirectoriesCollapsed && (
                    <DirectorySettings 
                        directories={directories}
                        handleAddDirectory={handleAddDirectory}
                        handleRemoveDirectory={handleRemoveDirectory}
                        handleScan={handleScan}
                    />
                )}
            </div>

            <div className="settings-section">
                <div className="collapsible-header" onClick={() => setIsQualityCollapsed(!isQualityCollapsed)}>
                    <ChevronRightIcon className={isQualityCollapsed ? '' : 'expanded'} />
                    <h2>Target Quality</h2>
                </div>

                {!isQualityCollapsed && (
                    <QualitySettings settings={qualitySettings} setSettings={setQualitySettings} />
                )}
            </div>

            <div className="settings-section">
                <div className="collapsible-header" onClick={() => setIsViewCollapsed(!isViewCollapsed)}>
                    <ChevronRightIcon className={isViewCollapsed ? '' : 'expanded'} />
                    <h2>View Options</h2>
                </div>
                {!isViewCollapsed && (
                    <ViewSettings settings={viewSettings} setSettings={setViewSettings} />
                )}
            </div>
        </>
    );
}

export default SettingsPage;