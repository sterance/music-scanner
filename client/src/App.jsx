import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { Toaster, toast } from 'react-hot-toast';

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
  const [viewSettings, setViewSettings] = useState(defaultViewSettings);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
            // load directories from localStorage
            const savedDirs = localStorage.getItem('musicScanner.directories');
            if (savedDirs) {
                setDirectories(JSON.parse(savedDirs));
            }
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
            setViewSettings({ ...defaultViewSettings, ...JSON.parse(savedViewSettings) });
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

  useEffect(() => {
    localStorage.setItem('musicScanner.directories', JSON.stringify(directories));
  }, [directories]);

  // --- Handler Functions ---
  const handleAddDirectory = async (pathInput) => {
    if (pathInput && !directories.includes(pathInput)) {
      setDirectories(prev => [...prev, pathInput]);
    }
  };

  const handleRemoveDirectory = async (pathToRemove) => {
    setDirectories(prev => prev.filter(p => p !== pathToRemove));
    try {
      const libraryResponse = await axios.get('http://localhost:3001/api/library');
      setLibrary(libraryResponse.data);
    } catch (error) {
      console.error('Failed to refresh library after directory removal:', error);
    }
  };
  
  const handleScan = async (dirPath) => {
    if (!dirPath) return;

    const scanPromise = axios.post('http://localhost:3001/api/scan', { paths: [dirPath] });
    toast.promise(scanPromise, {
        loading: `Scanning ${dirPath}...`,
        success: (res) => {
            setLibrary(res.data);
            return 'Scan complete!';
        },
        error: (err) => {
            console.error("Scan failed:", err);
            return `Scan failed: ${err.response?.data?.error || 'See console for details.'}`;
        }
    });
    try {
      const res = await axios.post('http://localhost:3001/api/scan', { paths: [dirPath] });
      setLibrary(res.data);
    } catch (err) {
      console.error("Scan failed:", err);
      alert("Scan failed. See console for details.");
    }
  };

  const handleScanAll = async () => {
    if (!directories || directories.length === 0) return;
    const scanPromise = axios.post('http://localhost:3001/api/scan', { paths: directories });
    toast.promise(scanPromise, {
      loading: `Scanning ${directories.length} director${directories.length > 1 ? 'ies' : 'y'}...`,
      success: (res) => { setLibrary(res.data); return 'Scan complete!'; },
      error: (err) => `Scan failed: ${err.response?.data?.error || 'See console for details.'}`
    });
    try {
      const res = await axios.post('http://localhost:3001/api/scan', { paths: directories });
      setLibrary(res.data);
    } catch (err) { console.error('Scan all failed:', err); }
  };

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
    <div className={`app-container ${currentPage === 'converter' ? 'layout-converter' : ''}`}>
        <Toaster 
            position="bottom-right"
            toastOptions={{
                style: {
                    background: '#333',
                    color: '#fff',
                },
            }}
        />
        <div className={`sidebar-overlay ${!isSidebarCollapsed ? 'visible' : ''}`} onClick={() => setIsSidebarCollapsed(true)} />
        <Sidebar 
            currentPage={currentPage} 
            setCurrentPage={setCurrentPage}
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
        />
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
                    setViewSettings={setViewSettings}
                />}
        </main>
    </div>
  );
}

export default App;