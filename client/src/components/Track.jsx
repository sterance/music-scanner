import React, { useState } from 'react';
import axios from 'axios';
import { EditIcon, AddToQueueIcon } from './Icons';
import { compareTrackToTarget } from '../utils/quality';
import { toast } from 'react-hot-toast';

function Track({ track, onRenameSuccess, displayBitDepth, qualitySettings, handleAddToQueue, showConvertColumn }) {
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(track.name);

    const handleRename = async (e) => {
        e.preventDefault();
        if (!onRenameSuccess) return;
        const fullNewName = newName + track.extension;
        if (fullNewName === (track.name + track.extension) || !newName) {
            setIsEditing(false);
            return;
        }
        const payload = { oldPath: track.path, newName: fullNewName };
        console.log('Rename track payload:', payload);
        try {
            await axios.post('http://localhost:3001/api/rename', payload);
            setIsEditing(false);
            onRenameSuccess();
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'An unknown error occurred.';
            console.error("Failed to rename track:", errorMsg);
            alert(`Failed to rename track: ${errorMsg}`);
            setIsEditing(false);
            setNewName(track.name);
        }
    };
    const handleCancel = () => { setIsEditing(false); setNewName(track.name); };
    const handleKeyDown = (e) => { if (e.key === 'Escape') { handleCancel(); } };
    
    const qualityStatus = compareTrackToTarget(track, qualitySettings);
    const isAboveTarget = qualityStatus === 'above';

    const handleAddClick = async () => {
        try {
            await handleAddToQueue(track);
            toast.success(`${track.name}${track.extension} added to queue.`);
        } catch (error) {
            toast.error(`Error: ${error.message}`);
        }
    };

    return (
        <tr>
            {showConvertColumn && (
                <td className="col-convert">
                    {isAboveTarget && !isEditing && (
                        <button
                            className="button button-convert button-edit"
                            title="Add to Conversion Queue"
                            onClick={handleAddClick}
                        >
                            <AddToQueueIcon />
                        </button>
                    )}
                </td>
            )}

            <td className="col-name">
                {isEditing ? (
                    <form onSubmit={handleRename} className="inline-edit-form">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus onClick={(e) => e.stopPropagation()}
                        />
                        <button
                            type="button"
                            className="button button-secondary"
                            onClick={handleCancel}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="button button-primary"
                        >
                            Save
                        </button>
                    </form>
                ) : (
                    <span>{track.name}</span>
                )}
            </td>
            <td className="col-type">{track.extension}</td>
            <td className="col-bitdepth">{displayBitDepth ? track.bitDepth : track.bitrate}</td>
            <td className="col-srate">{track.sampleRate}</td>
            <td className="col-actions">
                {!isEditing && (
                    <button
                        className="button button-edit"
                        title="Rename Track"
                        onClick={() => setIsEditing(true)}
                    >
                        <EditIcon />
                    </button>
                )}
            </td>
        </tr>
    );
}
export default Track;