import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

import Sidebar from './components/Sidebar';
import LibraryPage from './pages/LibraryPage';
import SettingsPage from './pages/SettingsPage';
import ConverterPage from './pages/ConverterPage';

const defaultQualitySettings = {
    formats: ['FLAC', 'WAV', 'AIFF', 'MP3', 'AAC', 'Opus', 'Ogg'],
    format: 'FLAC',
    bitrate: '320+ kbps',
    bitDepth: '16 bit',
    sampleRate: '44.1 kHz',
};
const defaultLibraryFilters = {
    below: true,
    target: true,
    above: true,
};

function App() {
  const [currentPage, setCurrentPage] = useState('library');
  const [directories, setDirectories] = useState([]);
  const [library, setLibrary] = useState([]);
  const [qualitySettings, setQualitySettings] = useState(defaultQualitySettings);
  const [libraryFilters, setLibraryFilters] = useState(defaultLibraryFilters);
  const [conversionQueue, setConversionQueue] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
        try {
            const dirsResponse = await axios.get('http://localhost:3001/api/directories');
            setDirectories(dirsResponse.data);
            const libraryResponse = await axios.get('http://localhost:3001/api/library');
            setLibrary(libraryResponse.data);
        } catch (error) {
            console.error("Failed to fetch initial data from database:", error);
        }
    };
    fetchInitialData();

    try {
        const savedQualitySettings = localStorage.getItem('qualitySettings');
        if (savedQualitySettings) {
            setQualitySettings({ ...defaultQualitySettings, ...JSON.parse(savedQualitySettings) });
        }
        const savedLibraryFilters = localStorage.getItem('libraryFilters');
        if (savedLibraryFilters) {
            setLibraryFilters(JSON.parse(savedLibraryFilters));
        }
        const savedConversionQueue = localStorage.getItem('conversionQueue');
        if (savedConversionQueue) {
            setConversionQueue(JSON.parse(savedConversionQueue));
        }
    } catch (error) {
        console.error("Failed to parse settings from localStorage", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('qualitySettings', JSON.stringify(qualitySettings));
  }, [qualitySettings]);

  useEffect(() => {
    localStorage.setItem('libraryFilters', JSON.stringify(libraryFilters));
  }, [libraryFilters]);

  useEffect(() => {
    localStorage.setItem('conversionQueue', JSON.stringify(conversionQueue));
  }, [conversionQueue]);

  const handleAddDirectory = async (pathInput) => {
    if (pathInput && !directories.some(dir => dir.path === pathInput)) {
        try {
            const response = await axios.post('http://localhost:3001/api/directories', { path: pathInput });
            setDirectories([...directories, response.data]);
        } catch (error) {
            console.error("Failed to add directory:", error);
            alert("Error: Could not add directory.");
        }
    }
  };

  const handleRemoveDirectory = async (id) => {
    try {
        await axios.delete(`http://localhost:3001/api/directories/${id}`);
        setDirectories(directories.filter(dir => dir.id !== id));
        const libraryResponse = await axios.get('http://localhost:3001/api/library');
        setLibrary(libraryResponse.data);
    } catch (error) {
        console.error("Failed to remove directory:", error);
        alert("Error: Could not remove directory.");
    }
  };
  
  const handleScan = async (id) => {
    const dirToScan = directories.find(d => d.id === id);
    if (!dirToScan) return;
    try {
      const res = await axios.post('http://localhost:3001/api/scan', { directoryId: id, path: dirToScan.path });
      setLibrary(res.data);
    } catch (err) {
      console.error("Scan failed:", err);
      alert("Scan failed. See console for details.");
    }
  };

  const handleScanAll = async () => { for (const dir of directories) { await handleScan(dir.id); } };

  return (
    <div className="main-layout">
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <main className="main-content">
            {currentPage === 'library' && 
                <LibraryPage 
                    library={library}
                    qualitySettings={qualitySettings}
                    libraryFilters={libraryFilters}
                    setLibraryFilters={setLibraryFilters}
                    handleScanAll={handleScanAll} 
                />}
            {currentPage === 'converter' && 
                <ConverterPage 
                    qualitySettings={qualitySettings} 
                    conversionQueue={conversionQueue} 
                    setConversionQueue={setConversionQueue} 
                />}
            {currentPage === 'settings' && 
                <SettingsPage 
                    directories={directories}
                    handleAddDirectory={handleAddDirectory}
                    handleRemoveDirectory={handleRemoveDirectory}
                    handleScan={handleScan}
                    qualitySettings={qualitySettings}
                    setQualitySettings={setQualitySettings}
                />}
        </main>
    </div>
  );
}

export default App;