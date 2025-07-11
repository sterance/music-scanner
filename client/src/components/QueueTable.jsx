import React from 'react';
import QueueItem from './QueueItem';

function QueueTable({ queue, setConversionQueue }) {
    return (
        <div className="queue-table-container">
            <table className="queue-table">
                <thead>
                    <tr>
                        <th id='queue-table-header-track'>Track</th>
                        <th id='queue-table-header-original'>Original</th>
                        <th id='queue-table-header-target'>Target</th>
                        <th id='queue-table-header-status'>Status</th>
                        <th id='queue-table-header-actions' className="col-actions"></th>
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