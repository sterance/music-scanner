const measureContent = (text, font) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = font;
    return context.measureText(text).width;
};

export const calculateColumnWidths = (containerWidth, tracks) => {
    if (!tracks || !tracks.length || !containerWidth) return null;

    const headerFont = '0.9rem -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const cellFont = '1rem -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    
    const padding = 16;
    
    const extWidth = Math.max(
        measureContent('Type', headerFont),
        ...tracks.map(t => measureContent(t.extension || '', cellFont))
    ) + padding;
    
    const bitDepthWidth = Math.max(
        measureContent('Bit Depth', headerFont),
        ...tracks.map(t => measureContent(t.bitDepth || '', cellFont))
    ) + padding;
    
    const sampleRateWidth = Math.max(
        measureContent('Sample Rate', headerFont),
        ...tracks.map(t => measureContent(t.sampleRate || '', cellFont))
    ) + padding;
    
    const actionsWidth = 60;
    
    const fixedWidth = extWidth + bitDepthWidth + sampleRateWidth + actionsWidth;
    const availableWidth = Math.max(0, containerWidth - fixedWidth);
    
    const trackLengths = tracks.map(t => (t.trackName || t.name || '').length);
    const albumLengths = tracks.map(t => (t.album || '').length);
    const artistLengths = tracks.map(t => (t.artist || '').length);
    
    const maxTrackLength = Math.max('Track'.length, ...trackLengths);
    const maxAlbumLength = Math.max('Album'.length, ...albumLengths);
    const maxArtistLength = Math.max('Artist'.length, ...artistLengths);
    
    // calculate actual width needed for artist column (no truncation)
    const artistActualWidth = Math.max(
        measureContent('Artist', headerFont),
        ...tracks.map(t => measureContent(t.artist || '', cellFont))
    ) + padding;
    
    const totalWeight = maxTrackLength + maxAlbumLength + maxArtistLength;
    
    const trackWidth = totalWeight > 0 ? (maxTrackLength / totalWeight) * availableWidth : availableWidth / 3;
    const albumWidth = totalWeight > 0 ? (maxAlbumLength / totalWeight) * availableWidth : availableWidth / 3;
    const artistWidth = totalWeight > 0 ? (maxArtistLength / totalWeight) * availableWidth : availableWidth / 3;
    
    // calculate max width as 25% of total container width
    const maxFlexColumnWidth = containerWidth * 0.25;
    
    return {
        track: Math.min(Math.max(trackWidth, 100), maxFlexColumnWidth),
        album: Math.min(Math.max(albumWidth, 100), maxFlexColumnWidth),
        artist: Math.max(artistActualWidth, 100),
        ext: Math.max(extWidth, 50),
        bitDepth: Math.max(bitDepthWidth, 80),
        sampleRate: Math.max(sampleRateWidth, 100),
        actions: actionsWidth
    };
};

export const applyColumnWidthsToTable = (tableElement, widths) => {
    if (!tableElement || !widths) return;
    
    tableElement.style.setProperty('--col-track-width', `${widths.track}px`);
    tableElement.style.setProperty('--col-album-width', `${widths.album}px`);
    tableElement.style.setProperty('--col-artist-width', `${widths.artist}px`);
    tableElement.style.setProperty('--col-ext-width', `${widths.ext}px`);
    tableElement.style.setProperty('--col-bitdepth-width', `${widths.bitDepth}px`);
    tableElement.style.setProperty('--col-srate-width', `${widths.sampleRate}px`);
    tableElement.style.setProperty('--col-actions-width', `${widths.actions}px`);
};

