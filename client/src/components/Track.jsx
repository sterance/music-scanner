import React, { useState } from 'react';
import axios from 'axios';
import { EditIcon } from './Icons';

function Track({ track, onRenameSuccess, displayBitDepth }) {
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

    return (
        <tr>
            <td className="col-name">
                {isEditing ? (
                    <form onSubmit={handleRename} className="inline-edit-form">
                        <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={handleKeyDown} autoFocus onClick={(e) => e.stopPropagation()} />
                        <button type="button" className="button button-secondary" onClick={handleCancel}>Cancel</button>
                        <button type="submit" className="button button-primary">Save</button>
                    </form>
                ) : (
                    <span>{track.name}</span>
                )}
            </td>
            <td className="col-type">{track.extension}</td>
            {/* Conditionally render the correct data */}
            <td className="col-bitdepth">{displayBitDepth ? track.bitDepth : track.bitrate}</td>
            <td className="col-srate">{track.sampleRate}</td>
            <td className="col-actions">
                {!isEditing && (
                    <button className="button button-edit" title="Rename Track" onClick={() => setIsEditing(true)}>
                        <EditIcon />
                    </button>
                )}
            </td>
        </tr>
    );
}
export default Track;