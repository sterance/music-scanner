import React from 'react';
import { PlayIcon, PauseIcon, ClearIcon } from '../components/Icons';
import QueueTable from '../components/QueueTable';

// A sub-component for the read-only target quality display
function TargetQualityDisplay({ settings }) {
    return (
        <div className="target-quality-display">
            <div className="target-quality-item">
                <strong>Target Format:</strong>
                <span>{settings.format}</span>
            </div>
            <div className="target-quality-item">
                <strong>Target Quality:</strong>
                <span>{settings.bitDepth}, {settings.sampleRate}</span>
            </div>
        </div>
    );
}

// A sub-component for the progress bars
function ProgressSection() {
    const overallProgress = 20;
    const currentFileProgress = 65;

    return (
        <div className="progress-section">
            <div className="progress-bar-container">
                <label>Overall Progress (2 of 10 files)</label>
                <div className="progress-bar-background">
                    <div className="progress-bar-foreground" style={{ width: `${overallProgress}%` }}></div>
                </div>
            </div>
            <div className="progress-bar-container">
                <label>Converting: Some Artist - Some Track.flac</label>
                <div className="progress-bar-background">
                    <div className="progress-bar-foreground" style={{ width: `${currentFileProgress}%` }}></div>
                </div>
            </div>
        </div>
    );
}

function ConverterPage({ qualitySettings, conversionQueue }) {

    const mockQueue = [
        { id: 1, name: "Some Artist - Some Track.flac", originalQuality: "24-bit, 96 kHz", targetQuality: "16-bit, 44.1 kHz", status: "Converting" },
        { id: 2, name: "Another Artist - Another Song.wav", originalQuality: "24-bit, 192 kHz", targetQuality: "16-bit, 44.1 kHz", status: "Pending" },
        { id: 3, name: "A Third Band - A Third Tune.aiff", originalQuality: "16-bit, 48 kHz", targetQuality: "16-bit, 44.1 kHz", status: "Pending" },
        { id: 4, name: "Test 4", originalQuality: "N/A", targetQuality: "N/A", status: "Pending" },
        { id: 5, name: "Test 5", originalQuality: "N/A", targetQuality: "N/A", status: "Pending" },
        { id: 6, name: "Test 6", originalQuality: "N/A", targetQuality: "N/A", status: "Pending" },
        { id: 7, name: "Test 7", originalQuality: "N/A", targetQuality: "N/A", status: "Pending" },
        { id: 8, name: "Test 8", originalQuality: "N/A", targetQuality: "N/A", status: "Pending" },
        { id: 9, name: "Test 9", originalQuality: "N/A", targetQuality: "N/A", status: "Pending" },
        { id: 10, name: "Test 10", originalQuality: "N/A", targetQuality: "N/A", status: "Pending" },
        { id: 11, name: "Test 11", originalQuality: "N/A", targetQuality: "N/A", status: "Pending" }
    ];

    return (
        <div className="converter-page-layout">
            <div className="content-wrapper">
                <header className="page-header">
                    <h1>Converter</h1>
                </header>
            </div>

            <QueueTable queue={mockQueue} />

            <div className="converter-bottom-bar">
                <ProgressSection />
                <div className="converter-controls-section">
                    <TargetQualityDisplay settings={qualitySettings} />
                     <div className="queue-controls">
                        <button className="button button-primary button-icon" title="Start Queue"><PlayIcon /></button>
                        <button className="button button-secondary button-icon" title="Pause Queue"><PauseIcon /></button>
                        <button className="button button-secondary button-icon" title="Clear Completed"><ClearIcon /></button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ConverterPage;