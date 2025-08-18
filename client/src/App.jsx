import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { Toaster } from 'react-hot-toast';

import Sidebar from './components/Sidebar';
import LibraryPage from './pages/LibraryPage';
import SettingsPage from './pages/SettingsPage';
import ConverterPage from './pages/ConverterPage';

const defaultQualitySettings = {
    formats: ['FLAC', 'ALAC', 'WAV', 'AIFF', 'Opus', 'Vorbis', 'AAC', 'MP3'],
    format: 'FLAC',
    bitrate: 'Hi-Res',
    bitDepth: '16 bit',
    sampleRate: '44.1 kHz',
};
const defaultLibraryFilters = {
    below: true,
    target: true,
    above: true,
};

const defaultViewSettings = {
    showWarnings: true,
}

function App() {
  const [currentPage, setCurrentPage] = useState('library');
  const [directories, setDirectories] = useState([]);
  const [library, setLibrary] = useState([]);
  const [qualitySettings, setQualitySettings] = useState(defaultQualitySettings);
  const [libraryFilters, setLibraryFilters] = useState(defaultLibraryFilters);
  const [conversionQueue, setConversionQueue] = useState([]);
  const [isQueuePaused, setIsQueuePaused] = useState(false);
  const [viewSettings, setViewsettings] = useState(defaultViewSettings);

  // --- WebSocket Connection ---
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001');

    ws.onopen = () => console.log('WebSocket connection established');
    ws.onclose = () => console.log('WebSocket connection closed');
    ws.onerror = (error) => console.error('WebSocket error:', error);

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);

        switch (data.type) {
            case 'queue_update':
                setConversionQueue(data.queue);
                break;
            case 'status_update':
                setConversionQueue(prevQueue =>
                    prevQueue.map(item =>
                        item.path === data.path ? { ...item, status: data.status, reason: data.reason || null } : item
                    )
                );
                break;
            case 'progress':
                 setConversionQueue(prevQueue =>
                    prevQueue.map(item =>
                        item.path === data.path ? { ...item, progress: data.percent } : item
                    )
                );
                break;
            case 'library_update':
                setLibrary(data.library);
                break;
            case 'pause_update':
                setIsQueuePaused(data.isPaused);
                break;
            default:
                break;
        }
    };

    return () => {
        ws.close();
    };
  }, []);

  // --- Load initial data ---
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
        const savedViewSettings = localStorage.getItem('viewSettings');
        if (savedViewSettings) {
            setViewsettings({ ...defaultViewSettings, ...JSON.parse(savedViewSettings) });
        }
    } catch (error) {
        console.error("Failed to parse settings from localStorage", error);
    }
  }, []);

  // --- Save settings to localStorage ---
  useEffect(() => {
    localStorage.setItem('qualitySettings', JSON.stringify(qualitySettings));
  }, [qualitySettings]);

  useEffect(() => {
    localStorage.setItem('libraryFilters', JSON.stringify(libraryFilters));
  }, [libraryFilters]);

  useEffect(() => {
    localStorage.setItem('viewSettings', JSON.stringify(viewSettings));
  }, [viewSettings]);

  // --- Handler Functions ---
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

  const handleAddToQueue = async (track) => {
    try {
        await axios.post('http://localhost:3001/api/convert/add', { track, qualitySettings });
    } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to add track to queue.';
        console.error(errorMsg);
        throw new Error(errorMsg);
    }
  };

  return (
    <div className={`main-layout ${currentPage === 'converter' ? 'layout-converter' : ''}`}>
        <Toaster 
            position="bottom-right"
            toastOptions={{
                style: {
                    background: '#333',
                    color: '#fff',
                },
            }}
        />
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <main className="main-content">
            {currentPage === 'library' && 
                <LibraryPage
                    library={library}
                    qualitySettings={qualitySettings}
                    libraryFilters={libraryFilters}
                    setLibraryFilters={setLibraryFilters}
                    handleScanAll={handleScanAll}
                    handleAddToQueue={handleAddToQueue}
                />}
            {currentPage === 'converter' &&
                <ConverterPage
                    qualitySettings={qualitySettings}
                    conversionQueue={conversionQueue}
                    setConversionQueue={setConversionQueue}
                    isQueuePaused={isQueuePaused}
                />}
            {currentPage === 'settings' &&
                <SettingsPage
                    directories={directories}
                    handleAddDirectory={handleAddDirectory}
                    handleRemoveDirectory={handleRemoveDirectory}
                    handleScan={handleScan}
                    qualitySettings={qualitySettings}
                    setQualitySettings={setQualitySettings}
                    viewSettings={viewSettings}
                    setViewsettings={setViewsettings}
                />}
        </main>
    </div>
  );
}

export default App;