import React, { useState } from 'react';
import QualitySettings from '../components/QualitySettings';
import DirectorySettings from '../components/DirectorySettings';
import { ChevronRightIcon } from '../components/Icons';

function SettingsPage({ directories, handleAddDirectory, handleRemoveDirectory, handleScan, qualitySettings, setQualitySettings }) {
    
    const [isDirectoriesCollapsed, setIsDirectoriesCollapsed] = useState(false);
    const [isQualityCollapsed, setIsQualityCollapsed] = useState(false);

    return (
        <>
            <header className="page-header">
                <h1>Settings</h1>
            </header>

            <div className="settings-section">
                <div className="collapsible-header" onClick={() => setIsDirectoriesCollapsed(!isDirectoriesCollapsed)}>
                    <ChevronRightIcon className={isDirectoriesCollapsed ? '' : 'expanded'} />
                    <h2>Directories</h2>
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
                    <h2>Quality</h2>
                </div>

                {!isQualityCollapsed && (
                    <QualitySettings settings={qualitySettings} setSettings={setQualitySettings} />
                )}
            </div>
        </>
    );
}

export default SettingsPage;