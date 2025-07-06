import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { ChevronRightIcon, EditIcon } from './Icons';
import Track from './Track';
import UnexpectedItems from './UnexpectedItems';

function Album({ album, onRenameSuccess }) {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(album.title);

    const unnecessarySubfolder = useMemo(() => {
        if (album.discs.length === 1 && !album.discs[0].isRoot) {
            return [{ name: album.discs[0].name, reason: 'This subfolder could be removed.' }];
        }
        return [];
    }, [album.discs]);

    const hasUnexpectedFiles = album.unexpectedItems && album.unexpectedItems.length > 0;

    const handleRename = async (e) => {
        e.preventDefault();
        if (!onRenameSuccess) return;
        if (newName === album.title || !newName) { setIsEditing(false); return; }
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
    const handleCancel = (e) => { e?.stopPropagation(); setIsEditing(false); setNewName(album.title); };
    const handleKeyDown = (e) => { if (e.key === 'Escape') { handleCancel(); } };

    return (
        <div className="album-section">
            <div className="collapsible-header" onClick={() => !isEditing && setIsCollapsed(!isCollapsed)}>
                <ChevronRightIcon className={isCollapsed ? '' : 'expanded'} />
                {isEditing ? (
                    <form onSubmit={handleRename} className="inline-edit-form">
                        <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={handleKeyDown} autoFocus onClick={(e) => e.stopPropagation()} />
                        <button type="button" className="button button-secondary" onClick={handleCancel}>Cancel</button>
                        <button type="submit" className="button button-primary">Save</button>
                    </form>
                ) : ( <h4>{album.title}</h4> )}
                {!isEditing && ( <button className="button button-edit" title="Rename Album" onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}> <EditIcon /> </button> )}
            </div>
            
            {!isCollapsed && (
                <div className="collapsible-content">
                    {album.discs.map((disc) => (
                        <DiscSection 
                            key={disc.path} 
                            disc={disc} 
                            showDiscHeader={album.discs.length > 1}
                            onRenameSuccess={onRenameSuccess} 
                        />
                    ))}
                    <UnexpectedItems items={unnecessarySubfolder} title="Unnecessary Subfolder Found" />
                    {hasUnexpectedFiles && <UnexpectedItems items={album.unexpectedItems} title="Non-Music Files Found" />}
                </div>
            )}
        </div>
    );
}

function DiscSection({ disc, showDiscHeader, onRenameSuccess }) {
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(disc.name);
    const hasBitDepth = useMemo(() => disc.tracks.some(track => track.bitDepth && track.bitDepth !== 'N/A'), [disc.tracks]);
    
    const handleDiscRename = async (e) => {
        e.preventDefault();
        if (!onRenameSuccess) return;
        if (newName === disc.name || !newName) { setIsEditing(false); return; }
        const payload = { oldPath: disc.path, newName };
        console.log('Rename disc payload:', payload);
        try {
            await axios.post('http://localhost:3001/api/rename', payload);
            setIsEditing(false);
            onRenameSuccess();
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'An unknown error occurred.';
            console.error("Failed to rename disc:", errorMsg);
            alert(`Failed to rename disc: ${errorMsg}`);
            setIsEditing(false);
            setNewName(disc.name);
        }
    };
    const handleDiscCancel = (e) => { e.stopPropagation(); setIsEditing(false); setNewName(disc.name); };
    const handleDiscKeyDown = (e) => { if (e.key === 'Escape') { handleDiscCancel(e); } };

    return (
        <div className="disc-section">
            {showDiscHeader && (
                <div className="collapsible-header">
                    {isEditing ? (
                         <form onSubmit={handleDiscRename} className="inline-edit-form">
                            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={handleDiscKeyDown} autoFocus onClick={(e) => e.stopPropagation()} />
                            <button type="button" className="button button-secondary" onClick={handleDiscCancel}>Cancel</button>
                            <button type="submit" className="button button-primary">Save</button>
                        </form>
                    ) : ( <h5>{disc.name}</h5> )}
                    {!isEditing && !disc.isRoot && (
                        <button className="button button-edit" title="Rename Disc" onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>
                            <EditIcon />
                        </button>
                    )}
                </div>
            )}
            <table className="track-table">
                <thead>
                    <tr>
                        <th className="col-name">Track Title</th>
                        <th className="col-type">Type</th>
                        <th className="col-bitdepth">{hasBitDepth ? 'Bit Depth' : 'Bit Rate'}</th>
                        <th className="col-srate">Sample Rate</th>
                        <th className="col-actions"></th>
                    </tr>
                </thead>
                <tbody>
                    {disc.tracks.map((track) => (
                        <Track key={track.path} track={track} onRenameSuccess={onRenameSuccess} displayBitDepth={hasBitDepth} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Album;