import React, { useState, useRef } from 'react';
import { DragHandleIcon } from './Icons';

const formatOptions = ['FLAC', 'ALAC', 'WAV', 'AIFF', 'Opus', 'Vorbis', 'AAC', 'MP3'];
const bitrateOptions = ['Hi-Res', '320 kbps', '256 kbps', '192 kbps', '160 kbps', '128 kbps', '96 kbps', '32 kbps'];
const bitDepthOptions = ['24+ bit', '24 bit', '16 bit', 'N/A'];
const sampleRateOptions = ['192 kHz', '176.4 kHz', '96 kHz', '88.2 kHz', '48 kHz', '44.1 kHz'];

function QualitySettings({ settings, setSettings }) {
    const [orderedFormats, setOrderedFormats] = useState(settings.formats || formatOptions);
    const dragItem = useRef(null);

    React.useEffect(() => {
        setOrderedFormats(settings.formats || formatOptions);
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
        
        setOrderedFormats(newFormats);
    };

    const handleDrop = () => {
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

    return (
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
                        </li>
                    ))}
                </ul>
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
    );
}

export default QualitySettings;