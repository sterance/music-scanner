import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FolderIcon, UpArrowIcon } from './Icons';

function FileBrowserModal({ onSelect, onClose }) {
    const [currentPath, setCurrentPath] = useState('');
    const [contents, setContents] = useState([]);
    const [selectedPath, setSelectedPath] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchPath = async (path) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post('http://localhost:3001/api/browse', { path });
            setCurrentPath(response.data.path);
            setSelectedPath(response.data.path);
            setContents(response.data.contents);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to browse path.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPath(null);
    }, []);

    const handleDirectoryClick = (path) => {
        fetchPath(path);
    };

    const handleUpDirectory = () => {
        const separator = currentPath.includes('\\') ? '\\' : '/';
        const parentDir = currentPath.substring(0, currentPath.lastIndexOf(separator));
        fetchPath(parentDir || '/');
    };
    
    const handleSelect = () => {
        onSelect(selectedPath);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>File Browser</h2>
                    <button className="modal-close-button" onClick={onClose}>&times;</button>
                </div>
                <div className="current-path-display">{selectedPath || currentPath}</div>
                <div className="file-browser-body">
                    {loading && <p>Loading...</p>}
                    {error && <div className="error-message">{error}</div>}
                    {!loading && (
                         <ul className="file-list">
                            <li className="file-item" onClick={handleUpDirectory}>
                               <UpArrowIcon /> ..
                            </li>
                            {contents.map(item => (
                                <li 
                                    key={item.path} 
                                    className={`file-item ${selectedPath === item.path ? 'selected' : ''}`}
                                    onClick={() => setSelectedPath(item.path)}
                                    onDoubleClick={() => handleDirectoryClick(item.path)}
                                >
                                    <FolderIcon />
                                    <span>{item.name}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="button button-secondary" onClick={onClose}>Cancel</button>
                    <button className="button button-primary" onClick={handleSelect} disabled={!selectedPath}>OK</button>
                </div>
            </div>
        </div>
    );
}

export default FileBrowserModal;