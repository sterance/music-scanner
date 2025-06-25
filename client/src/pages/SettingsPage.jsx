import React, { useState } from 'react';
import FileBrowserModal from '../components/FileBrowserModal';
import { FolderIcon, PlusIcon, TrashIcon } from '../components/Icons';

function SettingsPage({ directories, handleAddDirectory, handleRemoveDirectory, handleScan }) {
    const [pathInput, setPathInput] = useState('');
    const [isBrowserOpen, setIsBrowserOpen] = useState(false);

    const onAdd = () => {
        handleAddDirectory(pathInput);
        setPathInput('');
    };

    return (
        <>
            {isBrowserOpen && <FileBrowserModal onSelect={(path) => setPathInput(path)} onClose={() => setIsBrowserOpen(false)} />}
            
            <header className="page-header">
                <h1>Settings</h1>
                <p>Manage your music source directories.</p>
            </header>

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
        </>
    );
}

export default SettingsPage;