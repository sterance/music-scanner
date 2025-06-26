import React, { useState, useRef, useMemo } from 'react';
import { DragHandleIcon, PlusIcon, TrashIcon } from './Icons';

const allFormatOptions = [
    'DSF', 'DSDIFF', 'WAV', 'AIFF', 'BWF', 'FLAC', 'WV', 'APE', 'Opus', 
    'Vorbis', 'AAC', 'MPC', 'MP3', 'WMA', 'MP2', 'Speex', 'Matroska', 
    'WebM', 'Ogg', 'MPEG 4', 'ASF', 'Theora'
];
const bitrateOptions = ['320+ kbps', '320 kbps', '256 kbps', '192 kbps', '160 kbps', '128 kbps', '96 kbps', '32 kbps'];
const bitDepthOptions = ['24+ bit', '24 bit', '16 bit', 'N/A'];
const sampleRateOptions = ['192 kHz', '176.4 kHz', '96 kHz', '88.2 kHz', '48 kHz', '44.1 kHz'];


function AddFormatModal({ currentFormats, onAdd, onClose }) {
    const availableFormats = useMemo(() => {
        const currentSet = new Set(currentFormats);
        return allFormatOptions.filter(f => !currentSet.has(f));
    }, [currentFormats]);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add Audio Format</h2>
                    <button className="modal-close-button" onClick={onClose}>&times;</button>
                </div>
                <div className="file-browser-body">
                    <ul className="quality-list">
                        {availableFormats.map(format => (
                            <li key={format} className="quality-list-item" onClick={() => onAdd(format)}>
                                <span>{format}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}


function QualitySettings({ settings, setSettings }) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    // THE FIX IS HERE: We use a separate state for the visual order
    // that is only synced with the parent 'settings' on drop.
    const [orderedFormats, setOrderedFormats] = useState(settings.formats || []);
    const dragItem = useRef(null);
    
    // Sync local order state if the parent state changes
    React.useEffect(() => {
        setOrderedFormats(settings.formats || []);
    }, [settings.formats]);


    const handleDragStart = (e, index) => {
        dragItem.current = index;
        e.currentTarget.classList.add('dragging');
    };

    const handleDragEnter = (e, index) => {
        if (dragItem.current === index) return;
        
        const newFormats = [...orderedFormats];
        const draggedItemContent = newFormats.splice(dragItem.current, 1)[0];
        newFormats.splice(index, 0, draggedItemContent);
        dragItem.current = index;
        
        // Update the LOCAL state for the live preview
        setOrderedFormats(newFormats);
    };

    const handleDrop = () => {
        // Finalize the change in the PARENT state
        setSettings(prev => ({
            ...prev,
            formats: orderedFormats
        }));
        dragItem.current = null;
    };
    
    const handleDragEnd = (e) => {
        e.currentTarget.classList.remove('dragging');
    };

    const handleSettingChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleAddFormat = (formatToAdd) => {
        setSettings(prev => ({
            ...prev,
            formats: [...prev.formats, formatToAdd]
        }));
    };
    
    const handleRemoveFormat = (formatToRemove) => {
        setSettings(prev => {
            const newFormats = prev.formats.filter(f => f !== formatToRemove);
            const newTargetFormat = prev.format === formatToRemove ? (newFormats[0] || null) : prev.format;
            return {
                ...prev,
                format: newTargetFormat,
                formats: newFormats
            };
        });
    };

    return (
        <>
            {isAddModalOpen && 
                <AddFormatModal 
                    currentFormats={settings.formats}
                    onAdd={handleAddFormat}
                    onClose={() => setIsAddModalOpen(false)}
                />
            }
            <div className="quality-settings-grid">
                <div className="quality-list-container">
                    <h3 className="quality-list-title">Audio Format</h3>
                    <ul className="quality-list" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
                        {orderedFormats.map((option, index) => (
                            <li 
                                key={option} 
                                className={`quality-list-item reorderable ${settings.format === option ? 'active' : ''}`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragEnter={(e) => handleDragEnter(e, index)}
                                onDragEnd={handleDragEnd}
                                onClick={() => handleSettingChange('format', option)}
                            >
                                <DragHandleIcon />
                                <span>{option}</span>
                                <button className="remove-format-button" onClick={(e) => { e.stopPropagation(); handleRemoveFormat(option); }}>
                                    <TrashIcon />
                                </button>
                            </li>
                        ))}
                    </ul>
                    <button className="add-format-button" onClick={() => setIsAddModalOpen(true)}>
                        <PlusIcon /> Add Format
                    </button>
                </div>

                <div className="quality-list-container">
                    <h3 className="quality-list-title">Bit Rate</h3>
                    <ul className="quality-list">
                        {bitrateOptions.map(option => (
                            <li key={option} className={`quality-list-item ${settings.bitrate === option ? 'active' : ''}`} onClick={() => handleSettingChange('bitrate', option)}>
                                <span>{option}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="quality-list-container">
                    <h3 className="quality-list-title">Bit Depth</h3>
                    <ul className="quality-list">
                        {bitDepthOptions.map(option => (
                            <li key={option} className={`quality-list-item ${settings.bitDepth === option ? 'active' : ''}`} onClick={() => handleSettingChange('bitDepth', option)}>
                                <span>{option}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="quality-list-container">
                    <h3 className="quality-list-title">Sample Rate</h3>
                    <ul className="quality-list">
                        {sampleRateOptions.map(option => (
                            <li key={option} className={`quality-list-item ${settings.sampleRate === option ? 'active' : ''}`} onClick={() => handleSettingChange('sampleRate', option)}>
                                <span>{option}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </>
    );
}

export default QualitySettings;