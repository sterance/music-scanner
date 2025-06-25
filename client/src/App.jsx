import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import FileBrowserModal from './components/FileBrowserModal';
import Artist from './components/Artist';
import { FolderIcon, PlusIcon, TrashIcon } from './components/Icons';

function App() {
  const [pathInput, setPathInput] = useState('');
  const [directories, setDirectories] = useState([]);
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);

  useEffect(() => {
    try {
        const savedDirectories = localStorage.getItem('musicDirectories');
        if (savedDirectories) {
            const directoriesWithResetState = JSON.parse(savedDirectories).map(dir => ({
                ...dir,
                isLoading: false,
                error: null,
            }));
            setDirectories(directoriesWithResetState);
        }
    } catch (error) {
        console.error("Failed to parse directories from localStorage", error);
        setDirectories([]);
    }
  }, []);

  useEffect(() => {
    if (directories.length > 0) {
        localStorage.setItem('musicDirectories', JSON.stringify(directories));
    } else {
        const saved = localStorage.getItem('musicDirectories');
        if(saved) {
             localStorage.removeItem('musicDirectories');
        }
    }
  }, [directories]);

  const handleAddDirectory = () => {
    if (pathInput && !directories.some(dir => dir.path === pathInput)) {
      setDirectories([...directories, { id: Date.now(), path: pathInput, library: [], isLoading: false, error: null }]);
      setPathInput('');
    }
  };

  const handleRemoveDirectory = (id) => {
      const newDirectories = directories.filter(dir => dir.id !== id);
      setDirectories(newDirectories);
  };
  
  const handleScan = async (id) => {
    const dirToScan = directories.find(d => d.id === id);
    if (!dirToScan) return;
    setDirectories(dirs => dirs.map(d => d.id === id ? { ...d, isLoading: true, error: null } : d));
    try {
      const res = await axios.post('http://localhost:3001/api/scan', { directory: dirToScan.path });
      setDirectories(dirs => dirs.map(d => d.id === id ? { ...d, isLoading: false, library: res.data } : d));
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'An unexpected error occurred.';
      setDirectories(dirs => dirs.map(d => d.id === id ? { ...d, isLoading: false, library: [], error: errorMsg } : d));
    }
  };

  return (
    <div className="App">
        {isBrowserOpen && <FileBrowserModal onSelect={(path) => setPathInput(path)} onClose={() => setIsBrowserOpen(false)} />}
      
        <header className="App-header">
            <h1>Settings</h1>
            <h2>Library</h2>
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
                onClick={handleAddDirectory} 
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
                    {dir.library?.length > 0 && (
                        <div className="library-display">
                            {dir.library.map((artist, i) => (
                                <Artist 
                                    key={i} 
                                    artist={artist} 
                                    directoryPath={dir.path} 
                                    onRenameSuccess={() => handleScan(dir.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    </div>
  );
}

export default App;