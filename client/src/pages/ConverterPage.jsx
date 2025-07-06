import React from 'react';
import { PlayIcon, PauseIcon, ClearIcon, TrashIcon } from '../components/Icons'; // We will add these icons

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
    // These will be driven by state later
    const overallProgress = 20; // e.g., 20%
    const currentFileProgress = 65; // e.g., 65%

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

// A sub-component for a single item in the queue
function QueueItem({ track }) {
    return (
        <tr>
            <td>{track.name}</td>
            <td>{track.originalQuality}</td>
            <td>{track.targetQuality}</td>
            <td><span className={`status-badge status-${track.status.toLowerCase()}`}>{track.status}</span></td>
            <td className="col-actions">
                <button className="button button-edit" title="Remove from Queue">
                    <TrashIcon />
                </button>
            </td>
        </tr>
    );
}


function ConverterPage({ qualitySettings, conversionQueue }) {

    // Mock data for now, this will come from props later
    const mockQueue = [
        { id: 1, name: "Some Artist - Some Track.flac", originalQuality: "24-bit, 96 kHz", targetQuality: "16-bit, 44.1 kHz", status: "Converting" },
        { id: 2, name: "Another Artist - Another Song.wav", originalQuality: "24-bit, 192 kHz", targetQuality: "16-bit, 44.1 kHz", status: "Pending" },
        { id: 3, name: "A Third Band - A Third Tune.aiff", originalQuality: "16-bit, 48 kHz", targetQuality: "16-bit, 44.1 kHz", status: "Pending" },
    ];

    return (
        <>
            <header className="page-header">
                <h1>Converter</h1>
            </header>

            <div className="converter-layout">
                <div className="converter-main">
                    <ProgressSection />
                    <div className="queue-table-container">
                        <table className="queue-table">
                            <thead>
                                <tr>
                                    <th>Track</th>
                                    <th>Original</th>
                                    <th>Target</th>
                                    <th>Status</th>
                                    <th className="col-actions"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {mockQueue.map(track => (
                                    <QueueItem key={track.id} track={track} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="converter-sidebar">
                    <TargetQualityDisplay settings={qualitySettings} />
                     <div className="queue-controls">
                        <button className="button button-primary"><PlayIcon /> Start Queue</button>
                        <button className="button button-secondary"><PauseIcon /> Pause Queue</button>
                        <button className="button button-secondary"><ClearIcon /> Clear Completed</button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ConverterPage;