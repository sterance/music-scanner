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
                {directories.map(dir => (
                    <div key={dir.id} className="directory-item">
                        <div className="directory-header">
                            <span className="directory-path">{dir.path}</span>
                            <div className="directory-actions">
                                <button 
                                    className="button button-secondary button-icon" 
                                    title="Remove Directory"
                                    onClick={() => handleRemoveDirectory(dir.id)} 
                                    disabled={dir.isLoading}>
                                    <TrashIcon />
                                </button>
                                <button 
                                    className="button button-primary" 
                                    onClick={() => handleScan(dir.id)} 
                                    disabled={dir.isLoading}>
                                    {dir.isLoading ? 'Scanning...' : 'Scan'}
                                </button>
                            </div>
                        </div>
                        {dir.error && <div className="error-message">{dir.error}</div>}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default DirectorySettings;