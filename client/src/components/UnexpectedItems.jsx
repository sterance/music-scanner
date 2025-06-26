import React from 'react';
import { WarningIcon } from './Icons';

function UnexpectedItems({ items, title }) {
    if (!items || items.length === 0) return null;
    
    return (
        <div className="unexpected-items-container">
            <h6><WarningIcon /> {title}</h6>
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