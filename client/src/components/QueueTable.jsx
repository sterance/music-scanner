import React from 'react';
import QueueItem from './QueueItem';

function QueueTable({ queue, setConversionQueue }) {
    return (
        <div className="queue-table-container">
            <table className="queue-table">
                <thead>
                    <tr>
                        <th>Track</th>
                        <th>Original</th>
                        <th>Target</th>
                        <th>Status</th>
                        <th className="col-actions"></th>
                    </tr>
                </thead>
                <tbody>
                    {queue.map(track => (
                        <QueueItem 
                            key={track.path}
                            track={track} 
                            setConversionQueue={setConversionQueue} 
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default QueueTable;