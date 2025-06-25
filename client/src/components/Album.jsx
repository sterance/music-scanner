import React, { useState } from 'react';
import axios from 'axios';
import { ChevronRightIcon, EditIcon } from './Icons';
import Track from './Track';

function Album({ album, onRenameSuccess }) {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(album.title);

    const handleRename = async (e) => {
        e.preventDefault();
        if (!onRenameSuccess) return;

        if (newName === album.title || !newName) {
            setIsEditing(false);
            return;
        }

        const payload = { oldPath: album.path, newName };
        console.log('Rename album payload:', payload);

        try {
            await axios.post('http://localhost:3001/api/rename', payload);
            setIsEditing(false);
            onRenameSuccess();
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'An unknown error occurred.';
            console.error("Failed to rename album:", errorMsg);
            alert(`Failed to rename album: ${errorMsg}`);
            setIsEditing(false);
            setNewName(album.title);
        }
    };

    const handleCancel = (e) => {
        e?.stopPropagation();
        setIsEditing(false);
        setNewName(album.title);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            handleCancel();
        }
    };

    return (
        <div className="album-section">
            <div className="collapsible-header" onClick={() => !isEditing && setIsCollapsed(!isCollapsed)}>
                <ChevronRightIcon className={isCollapsed ? '' : 'expanded'} />
                
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
                    <h4>{album.title}</h4>
                )}

                {!isEditing && (
                    <button 
                        className="button button-edit" 
                        title="Rename Album" 
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsEditing(true);
                        }}>
                        <EditIcon />
                    </button>
                )}
            </div>
            
            {!isCollapsed && (
                <div className="collapsible-content">
                    <ul>
                        {album.tracks.map((track, index) => (
                            <Track 
                                key={index} 
                                track={track}
                                onRenameSuccess={onRenameSuccess} 
                            />
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default Album;