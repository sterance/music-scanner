import React, { useState } from 'react';
import axios from 'axios';
import { EditIcon } from './Icons';

function Track({ track, onRenameSuccess }) {
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(track.name);

    const handleRename = async (e) => {
        e.preventDefault();
        if (!onRenameSuccess) return;

        if (newName === track.name || !newName) {
            setIsEditing(false);
            return;
        }
        
        const payload = { oldPath: track.path, newName };
        console.log('Rename track payload:', payload);

        try {
            await axios.post('http://localhost:3001/api/rename', { oldPath: track.path, newName });
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

    const handleCancel = () => {
        setIsEditing(false);
        setNewName(track.name);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            handleCancel();
        }
    };

    return (
        <li className="track-item">
            {isEditing ? (
                <form onSubmit={handleRename} className="inline-edit-form">
                    <input 
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        onClick={(e) => e.stopPropagation()} 
                    />
                    <button type="button" className="button button-secondary" onClick={handleCancel}>Cancel</button>
                    <button type="submit" className="button button-primary">Save</button>
                </form>
            ) : (
                <span>{track.name}</span>
            )}

            {!isEditing && (
                <button 
                    className="button button-edit" 
                    title="Rename Track" 
                    onClick={() => setIsEditing(true)}>
                    <EditIcon />
                </button>
            )}
        </li>
    );
}

export default Track;