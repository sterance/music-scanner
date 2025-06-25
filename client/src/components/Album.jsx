import React, { useState } from 'react';
import axios from 'axios';
import { ChevronRightIcon, EditIcon } from './Icons';

function Album({ album, artistPath, onRenameSuccess }) {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(album.title);

    const handleRename = async (e) => {
        e.preventDefault();
        if (newName === album.title || !newName) {
            setIsEditing(false);
            return;
        }

        try {
            const oldPath = `${artistPath}/${album.title}`;
            await axios.post('http://localhost:3001/api/rename', { oldPath, newName });
            setIsEditing(false);
            onRenameSuccess();
        } catch (error) {
            console.error("Failed to rename album:", error);
            alert("Failed to rename album. Check console for details.");
            setIsEditing(false);
            setNewName(album.title);
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
                            autoFocus
                            onClick={(e) => e.stopPropagation()} 
                        />
                        <button type="button" className="button button-secondary" onClick={(e) => {e.stopPropagation(); setIsEditing(false);}}>Cancel</button>
                        <button type="submit" className="button button-primary">Save</button>
                    </form>
                ) : (
                    <h4>{album.title}</h4>
                )}

                {!isEditing && (
                    <button 
                        className="button button-edit" 
                        title="Rename Album" 
                        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>
                        <EditIcon />
                    </button>
                )}
            </div>
            
            {!isCollapsed && (
                <div className="collapsible-content">
                    <ul>
                        {album.tracks.map((track, index) => (
                            <li key={index}>{track}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default Album;