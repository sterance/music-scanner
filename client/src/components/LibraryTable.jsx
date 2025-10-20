import React, { useEffect, useRef, useCallback } from 'react';
import { PlusIcon, EditIcon } from './Icons';
import { calculateColumnWidths, applyColumnWidthsToTable } from '../utils/tableColumnResize';

function LibraryTable({ tracks, onAddToQueue }) {
    const containerRef = useRef(null);
    const tableRef = useRef(null);

    const applyWidths = useCallback(() => {
        if (!tableRef.current || !containerRef.current || !tracks.length) return;

        const containerWidth = containerRef.current.clientWidth;
        const widths = calculateColumnWidths(containerWidth, tracks);

        if (widths) {
            applyColumnWidthsToTable(tableRef.current, widths);
        }
    }, [tracks]);

    useEffect(() => {
        applyWidths();
    }, [applyWidths]);

    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver(() => {
            applyWidths();
        });

        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, [applyWidths]);
    return (
        <div className="table-responsive" ref={containerRef}>
            <table className="track-table" ref={tableRef}>
                <thead>
                    <tr>
                        <th className="col-name">Track</th>
                        <th className="col-type">Album</th>
                        <th className="col-type">Artist</th>
                        <th className="col-type">Type</th>
                        <th className="col-bitdepth">Bit Depth</th>
                        <th className="col-srate">Sample Rate</th>
                        <th className="col-actions"></th>
                    </tr>
                </thead>
                <tbody>
                    {tracks.map(t => (
                        <tr key={t.path}>
                            <td>{t.trackName || t.name}</td>
                            <td>{t.album}</td>
                            <td>{t.artist}</td>
                            <td>{t.extension}</td>
                            <td>{t.bitDepth}</td>
                            <td>{t.sampleRate}</td>
                            <td className="col-actions">
                                <div className="button-wrapper">
                                    {onAddToQueue && (
                                        <button className="button button-primary" onClick={() => onAddToQueue({ name: t.trackName || t.name, extension: t.extension, bitDepth: t.bitDepth, sampleRate: t.sampleRate, path: t.path })}>
                                            <PlusIcon />
                                        </button>
                                    )}
                                    <button className='button button-primary'>
                                        <span style={{ display: 'inline-block', transform: 'scale(0.7)', transformOrigin: 'center' }}>
                                            <EditIcon />
                                            {/* TODO: add edit icon functionality, open a modal for editing */}
                                        </span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default LibraryTable;

