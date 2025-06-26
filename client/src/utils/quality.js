const parseBitDepth = (bitDepthStr) => {
    if (!bitDepthStr || bitDepthStr === 'N/A') return 0;
    if (bitDepthStr.includes('+')) {
        return parseInt(bitDepthStr, 10) + 1; // Treat 24+ as 25 for comparison
    }
    return parseInt(bitDepthStr, 10);
};

const parseSampleRate = (sampleRateStr) => {
    if (!sampleRateStr) return 0;
    return parseFloat(sampleRateStr) * 1000;
};

const parseBitrate = (bitrateStr) => {
    if (!bitrateStr || bitrateStr === 'N/A') return 0;
    if (bitrateStr.includes('+')) {
        return parseInt(bitrateStr, 10) + 1; // Treat 320+ as 321 for comparison
    }
    return parseInt(bitrateStr, 10);
};

/**
 * Compares a track's metadata against the user's target quality settings.
 * @param {object} track - The track object from the library.
 * @param {object} qualitySettings - The user's target quality settings.
 * @returns {string} - "target", "above", or "below".
 */
export const compareTrackToTarget = (track, qualitySettings) => {
    const trackBitDepth = parseBitDepth(track.bitDepth);
    const targetBitDepth = parseBitDepth(qualitySettings.bitDepth);

    const trackSampleRate = parseSampleRate(track.sampleRate);
    const targetSampleRate = parseSampleRate(qualitySettings.sampleRate);

    const trackBitrate = parseBitrate(track.bitrate);
    const targetBitrate = parseBitrate(qualitySettings.bitrate);
    
    const bitDepthComparison = Math.sign(trackBitDepth - targetBitDepth);
    const sampleRateComparison = Math.sign(trackSampleRate - targetSampleRate);
    const bitrateComparison = Math.sign(trackBitrate - targetBitrate);

    const comparisons = [];
    
    if (trackBitDepth > 0 && targetBitDepth > 0) {
        comparisons.push(bitDepthComparison);
    } else {
        comparisons.push(bitrateComparison);
    }
    comparisons.push(sampleRateComparison);
    
    const isAbove = comparisons.some(c => c > 0);
    const isBelow = comparisons.some(c => c < 0);

    if (isAbove && !isBelow) return 'above';
    if (isBelow && !isAbove) return 'below';
    if (isAbove && isBelow) return 'below';

    return 'target';
};