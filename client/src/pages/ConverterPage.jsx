import React from 'react';
import axios from 'axios';
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

function ProgressSection({ currentlyConverting, queue }) {
    const completedCount = queue.filter(item => item.status === 'Complete').length;
    const overallProgress = queue.length > 0 ? (completedCount / queue.length) * 100 : 0;

    let progressLabel = 'Waiting to start...';
    if (currentlyConverting) {
        progressLabel = `Converting: ${currentlyConverting.name}`;
    } else if (queue.length > 0 && completedCount === queue.length) {
        progressLabel = 'Conversion completed!';
    }

    return (
        <div className="progress-section">
            <div className="progress-bar-container">
                <label>Overall Progress ({completedCount} of {queue.length} files)</label>
                <div className="progress-bar-background">
                    <div className="progress-bar-foreground" style={{ width: `${overallProgress}%` }}></div>
                </div>
            </div>
            <div className="progress-bar-container">
                <label>{progressLabel}</label>
                <div className="progress-bar-background">
                    <div className="progress-bar-foreground" style={{ width: `${currentlyConverting?.progress || 0}%` }}></div>
                </div>
            </div>
        </div>
    );
}

function ConverterPage({ qualitySettings, conversionQueue, setConversionQueue }) {

    const handleStartQueue = async () => {
        try {
            await axios.post('http://localhost:3001/api/convert/start');
        } catch (error) {
            console.error("Failed to start queue:", error);
            alert(`Error: ${error.response?.data?.message || 'Could not start conversion queue.'}`);
        }
    };

    const handleClearCompleted = async () => {
        try {
            await axios.post('http://localhost:3001/api/convert/clear');
        } catch (error) {
            console.error("Failed to clear queue:", error);
            alert("Error: Could not clear completed items.");
        }
    };

    const currentlyConverting = conversionQueue.find(item => item.status === 'Converting');
    const hasPending = conversionQueue.some(item => item.status === 'Pending');

    return (
        <>
            <header className="page-header">
                <h1>Converter</h1>
            </header>

            <QueueTable queue={conversionQueue} setConversionQueue={setConversionQueue} />

            <div className="converter-bottom-bar">
                <ProgressSection currentlyConverting={currentlyConverting} queue={conversionQueue} />
                <div className="converter-controls-section">
                    <TargetQualityDisplay settings={qualitySettings} />
                     <div className="queue-controls">
                        <button className="button button-primary button-icon" title="Start Queue" onClick={handleStartQueue} disabled={!hasPending}><PlayIcon /></button>
                        <button className="button button-secondary button-icon" title="Pause Queue"><PauseIcon /></button>
                        <button className="button button-secondary button-icon" title="Clear Completed" onClick={handleClearCompleted}><ClearIcon /></button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ConverterPage;