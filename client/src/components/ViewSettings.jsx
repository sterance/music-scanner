import React from 'react';

function ViewSettings({ settings, setSettings }) {
    const handleToggle = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="view-settings-container">
            <div className="setting-toggle-row">
                <span className="setting-label">Display Library Warnings</span>
                <label className="switch">
                    <input 
                        type="checkbox" 
                        checked={settings.showWarnings} 
                        onChange={() => handleToggle('showWarnings')} 
                    />
                    <span className="slider round"></span>
                </label>
            </div>
        </div>
    );
}

export default ViewSettings;