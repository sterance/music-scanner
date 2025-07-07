import React from 'react';
import { TrashIcon } from './Icons';

function QueueItem({ track, setConversionQueue }) {
    const handleRemove = () => {
        setConversionQueue(prevQueue => prevQueue.filter(item => item.path !== track.path));
    };

    return (
        <tr>
            <td>{track.name}</td>
            <td>{track.originalQuality}</td>
            <td>{track.targetQuality}</td>
            <td>
                <span className={`status-badge status-${track.status.toLowerCase()}`}>
                    {track.status}
                </span>
            </td>
            <td className="col-actions">
                {track.status === 'Pending' && (
                    <button className="button button-edit" title="Remove from Queue" onClick={handleRemove}>
                        <TrashIcon />
                    </button>
                )}
            </td>
        </tr>
    );
}

export default QueueItem;