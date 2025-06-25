import React, { useState } from 'react';
import axios from 'axios';
import Album from './Album';
import { ChevronRightIcon, EditIcon } from './Icons';

function Artist({ artist, directoryPath, onRenameSuccess }) {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(artist.name);

    const handleRename = async (e) => {
        e.preventDefault();
        if (newName === artist.name || !newName) {
            setIsEditing(false);
            return;
        }

        try {
            const oldPath = `${directoryPath}/${artist.name}`;
            await axios.post('http://localhost:3001/api/rename', { oldPath, newName });
            setIsEditing(false);
            onRenameSuccess();
        } catch (error) {
            console.error("Failed to rename artist:", error);
            alert("Failed to rename artist. Check console for details.");
            setIsEditing(false);
            setNewName(artist.name);
        }
    };

    return (
        <div className="artist-card">
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
                    <h3>{artist.name}</h3>
                )}

                {!isEditing && (
                    <button 
                        className="button button-edit" 
                        title="Rename Artist" 
                        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>
                        <EditIcon />
                    </button>
                )}
            </div>

            {!isCollapsed && (
                <div className="collapsible-content">
                    {artist.albums.map((album, index) => (
                        <Album 
                            key={index} 
                            album={album} 
                            artistPath={`${directoryPath}/${artist.name}`}
                            onRenameSuccess={onRenameSuccess}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default Artist;