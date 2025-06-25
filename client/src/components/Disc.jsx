import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { EditIcon } from './Icons';
import Track from './Track';

function Disc({ disc, onRenameSuccess }) {
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(disc.name);

    const hasBitDepth = useMemo(() => {
        return disc.tracks.some(track => track.bitDepth && track.bitDepth !== 'N/A');
    }, [disc.tracks]);

    const handleRename = async (e) => {
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
    const handleCancel = (e) => { e?.stopPropagation(); setIsEditing(false); setNewName(disc.name); };
    const handleKeyDown = (e) => { if (e.key === 'Escape') { handleCancel(); } };

    return (
        <div className="disc-section">
            <div className="collapsible-header">
                {isEditing ? (
                    <form onSubmit={handleRename} className="inline-edit-form">
                        <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={handleKeyDown} autoFocus onClick={(e) => e.stopPropagation()} />
                        <button type="button" className="button button-secondary" onClick={handleCancel}>Cancel</button>
                        <button type="submit" className="button button-primary">Save</button>
                    </form>
                ) : ( <h5>{disc.name}</h5> )}
                {!isEditing && ( <button className="button button-edit" title="Rename Disc" onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}> <EditIcon /> </button> )}
            </div>

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
                        <Track key={track.path} track={track} onRenameSuccess={onRenameSuccess} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
export default Disc;