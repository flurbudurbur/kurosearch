export const isGif = (url: string) => url.endsWith('.gif');
export const getGifSources = (full: string, sample: string, preview: string) =>
	isGif(sample) ? { static: preview, animated: sample } : { static: sample, animated: full };

export const isVideo = (url: string) => url.endsWith('.mp4') || url.endsWith('.webm');
export const getVideoSources = (full: string, sample: string, preview: string) =>
	isVideo(sample) ? { static: preview, animated: sample } : { static: sample, animated: full };

export const isLoop = (tags: kurosearch.Tag[]) => tags.some((t) => t.name === 'loop');

export const isAnimated = (url: string) => isGif(url) || isVideo(url);

export const getExtension = (url: string) => {
	const parts = url.split('.');
	return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

/**
 * Determines the optimal image URL to use based on image dimensions and user preferences.
 * For LCP optimization, uses sample_url for images wider than 1080px unless high resolution is explicitly enabled.
 * @param width - The original image width
 * @param fileUrl - The full resolution image URL
 * @param sampleUrl - The sample/optimized image URL
 * @param highResolutionEnabled - Whether user has enabled high resolution mode
 * @returns The optimal URL to use
 */
export const getOptimalImageUrl = (
	width: number,
	fileUrl: string,
	sampleUrl: string,
	highResolutionEnabled: boolean
): string => {
	// If high resolution is disabled, always use sample
	if (!highResolutionEnabled) {
		return sampleUrl;
	}

	// For LCP optimization: if image is wider than 1080px, use sample_url even with high res enabled
	// This improves load times for large images without significant quality loss on most displays
	if (width > 1080) {
		return sampleUrl;
	}

	// For smaller images, use full resolution when high res is enabled
	return fileUrl;
};
