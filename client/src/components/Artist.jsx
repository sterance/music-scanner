import React, { useState } from 'react';
import axios from 'axios';
import Album from './Album';
import UnexpectedItems from './UnexpectedItems';
import { ChevronRightIcon, EditIcon } from './Icons';
import { toast } from 'react-hot-toast';

function Artist({ artist, onRenameSuccess, qualitySettings, handleAddToQueue, showWarnings }) {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(artist.name);
    const [areArtistFilesIgnored, setAreArtistFilesIgnored] = useState(false);

    const handleRename = async (e) => {
        e.preventDefault();
        if (!onRenameSuccess) return;
        if (newName === artist.name || !newName) { setIsEditing(false); return; }
        const payload = { oldPath: artist.path, newName };
        console.log('Rename artist payload:', payload);
        try {
            await axios.post('http://localhost:3001/api/rename', payload);
            setIsEditing(false);
            onRenameSuccess();
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'An unknown error occurred.';
            console.error("Failed to rename artist:", errorMsg);
            alert(`Failed to rename artist: ${errorMsg}`);
            setIsEditing(false);
            setNewName(artist.name);
        }
    };
    const handleCancel = (e) => { e?.stopPropagation(); setIsEditing(false); setNewName(artist.name); };
    const handleKeyDown = (e) => { if (e.key === 'Escape') { handleCancel(); } };
    
    const handleDeleteUnexpectedArtistFiles = async () => {
        const filePaths = artist.unexpectedItems.map(item => item.path);
        try {
            await axios.post('http://localhost:3001/api/delete-files', { filePaths });
            onRenameSuccess();
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'An unknown error occurred.';
            toast.error(`Error: ${errorMsg}`);
        }
    };

    const unexpectedArtistItems = areArtistFilesIgnored ? [] : artist.unexpectedItems;
    const hasUnexpected = unexpectedArtistItems && unexpectedArtistItems.length > 0;

    return (
        <div className="artist-card">
            <div className="collapsible-header" onClick={() => !isEditing && setIsCollapsed(!isCollapsed)}>
                <ChevronRightIcon className={isCollapsed ? '' : 'expanded'} />
                {isEditing ? (
                    <form onSubmit={handleRename} className="inline-edit-form">
                        <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={handleKeyDown} autoFocus onClick={(e) => e.stopPropagation()} />
                        <button type="button" className="button button-secondary" onClick={handleCancel}>Cancel</button>
                        <button type="submit" className="button button-primary">Save</button>
                    </form>
                ) : ( <h3>{artist.name}</h3> )}
                {!isEditing && ( <button className="button button-edit" title="Rename Artist" onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}> <EditIcon /> </button> )}
            </div>

            {!isCollapsed && (
                <div className="collapsible-content">
                    {artist.albums.map((album) => (
                        <Album 
                            key={album.path} 
                            album={album} 
                            onRenameSuccess={onRenameSuccess}
                            qualitySettings={qualitySettings}
                            handleAddToQueue={handleAddToQueue}
                            showWarnings={showWarnings}
                        />
                    ))}
                    {showWarnings && hasUnexpected (
                        <UnexpectedItems 
                            items={unexpectedArtistItems}
                            title="Non-Music Files Found"
                            onFix={handleDeleteUnexpectedArtistFiles}
                            onIgnore={() => setAreArtistFilesIgnored(true)}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
export default Artist;