import React from 'react';
import { WarningIcon, FixIcon, IgnoreIcon } from './Icons';

function UnexpectedItems({ items, title, onFix, onIgnore }) {
    if (!items || items.length === 0) return null;

    const showActions = title === "Unnecessary Subfolder Found" || title === "Non-Music Files Found";

    return (
        <div className="unexpected-items-container">
            <div className="unexpected-items-header">
                <h6><WarningIcon /> {title}</h6>
                {showActions && (
                    <div className="unexpected-items-actions">
                        <button className="button button-secondary button-icon" title="Ignore" onClick={onIgnore}>
                            <IgnoreIcon />
                        </button>
                        <button className="button button-primary button-icon" title="Fix All" onClick={onFix}>
                            <FixIcon />
                        </button>
                    </div>
                )}
            </div>

            {items.map((item, index) => (
                <div key={index} className="unexpected-item">
                    <span className="unexpected-item-name">{item.name}</span>
                    <span className="unexpected-item-reason">{item.reason}</span>
                </div>
            ))}
        </div>
    );
}

export default UnexpectedItems;