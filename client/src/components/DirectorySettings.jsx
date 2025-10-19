import React, { useState } from 'react';
import FileBrowserModal from './FileBrowserModal';
import { FolderIcon, PlusIcon, TrashIcon } from './Icons';

function DirectorySettings({ directories, handleAddDirectory, handleRemoveDirectory, handleScan }) {
    const [pathInput, setPathInput] = useState('');
    const [isBrowserOpen, setIsBrowserOpen] = useState(false);

    const onAdd = () => {
        handleAddDirectory(pathInput);
        setPathInput('');
    };

    return (
        <div className="directory-settings-container">
            {isBrowserOpen && <FileBrowserModal onSelect={(path) => setPathInput(path)} onClose={() => setIsBrowserOpen(false)} />}

            <div className="add-directory-controls">
                <input
                    type="text"
                    value={pathInput}
                    onChange={(e) => setPathInput(e.target.value)}
                    placeholder="Type or browse for a directory..."
                />
                <button 
                    className="button button-secondary button-icon" 
                    title="Browse file system" 
                    onClick={() => setIsBrowserOpen(true)}>
                    <FolderIcon />
                </button>
                <button 
                    className="button button-primary button-icon"
                    title="Add Directory"
                    onClick={onAdd} 
                    disabled={!pathInput}>
                    <PlusIcon />
                </button>
            </div>

            <div className="directory-list-container">
                {directories.map(dirPath => (
                    <div key={dirPath} className="directory-item">
                        <div className="directory-header">
                            <span className="directory-path">{dirPath}</span>
                            <div className="directory-actions">
                                <button 
                                    className="button button-secondary button-icon" 
                                    title="Remove Directory"
                                    onClick={() => handleRemoveDirectory(dirPath)}>
                                    <TrashIcon />
                                </button>
                                <button 
                                    className="button button-primary" 
                                    onClick={() => handleScan(dirPath)}>
                                    Scan
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default DirectorySettings;