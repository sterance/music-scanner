import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

import Sidebar from './components/Sidebar';
import LibraryPage from './pages/LibraryPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  const [currentPage, setCurrentPage] = useState('library');
  const [directories, setDirectories] = useState([]);

  // Load directories from localStorage on initial mount
  useEffect(() => {
    try {
        const savedDirectories = localStorage.getItem('musicDirectories');
        if (savedDirectories) {
            const dirs = JSON.parse(savedDirectories).map(dir => ({...dir, isLoading: false, error: null}));
            setDirectories(dirs);
        }
    } catch (error) {
        console.error("Failed to parse from localStorage", error);
    }
  }, []);

  // Save directories to localStorage whenever they change
  useEffect(() => {
    if (directories.length > 0) {
        localStorage.setItem('musicDirectories', JSON.stringify(directories));
    } else {
        const saved = localStorage.getItem('musicDirectories');
        if(saved) localStorage.removeItem('musicDirectories');
    }
  }, [directories]);

  const handleAddDirectory = (pathInput) => {
    if (pathInput && !directories.some(dir => dir.path === pathInput)) {
      setDirectories([...directories, { id: Date.now(), path: pathInput, library: [], isLoading: false, error: null }]);
    }
  };

  const handleRemoveDirectory = (id) => {
      setDirectories(directories.filter(dir => dir.id !== id));
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

  // Scans all directories. Used to refresh the library after a rename.
  const handleScanAll = async () => {
    for (const dir of directories) {
        await handleScan(dir.id);
    }
  };

  return (
    <div className="main-layout">
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <main className="main-content">
            {currentPage === 'library' && 
                <LibraryPage 
                    directories={directories} 
                    handleScanAll={handleScanAll}
                />}
            {currentPage === 'settings' && 
                <SettingsPage 
                    directories={directories}
                    handleAddDirectory={handleAddDirectory}
                    handleRemoveDirectory={handleRemoveDirectory}
                    handleScan={handleScan}
                />}
        </main>
    </div>
  );
}

export default App;