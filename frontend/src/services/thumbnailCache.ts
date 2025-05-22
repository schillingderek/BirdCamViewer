const CACHE_NAME = 'birdcam-thumbnails-v1';

export async function getCachedThumbnail(url: string): Promise<string | null> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(url);
    if (response) {
      return URL.createObjectURL(await response.blob());
    }
    return null;
  } catch (error) {
    console.error('Error getting cached thumbnail:', error);
    return null;
  }
}

export async function cacheThumbnail(url: string, blob: Blob): Promise<void> {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(url, new Response(blob));
  } catch (error) {
    console.error('Error caching thumbnail:', error);
  }
}

export async function generateVideoThumbnail(videoUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    
    // Set a timeout to handle cases where the video fails to load
    const timeout = setTimeout(() => {
      video.remove();
      reject(new Error('Video loading timed out'));
    }, 15000);  // 15 second timeout
    
    let hasError = false;
    
    const cleanup = () => {
      clearTimeout(timeout);
      video.remove();
    };
    
    video.onloadeddata = () => {
      if (hasError) return;
      try {
        // Try to seek to 2 seconds for a better frame
        video.currentTime = 2;
      } catch (error) {
        try {
          video.currentTime = 0.5;
        } catch (error) {
          cleanup();
          reject(new Error('Failed to set video time'));
        }
      }
    };
    
    video.onseeked = async () => {
      if (hasError) return;
      try {
        const canvas = document.createElement('canvas');
        // Use a larger size for better quality
        canvas.width = 640;
        canvas.height = 360;
        const ctx = canvas.getContext('2d', { alpha: false });
        
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }
        
        // Fill with black background
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Calculate aspect ratio preserving dimensions
        const videoRatio = video.videoWidth / video.videoHeight;
        const canvasRatio = canvas.width / canvas.height;
        
        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        let offsetX = 0;
        let offsetY = 0;
        
        if (videoRatio > canvasRatio) {
          // Video is wider than canvas
          drawHeight = canvas.width / videoRatio;
          offsetY = (canvas.height - drawHeight) / 2;
        } else {
          // Video is taller than canvas
          drawWidth = canvas.height * videoRatio;
          offsetX = (canvas.width - drawWidth) / 2;
        }
        
        // Draw the video frame
        ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
        
        // Convert to JPEG with high quality
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
          }, 'image/jpeg', 0.95); // Increased quality to 0.95
        });
        
        await cacheThumbnail(videoUrl, blob);
        cleanup();
        resolve(URL.createObjectURL(blob));
      } catch (error) {
        cleanup();
        reject(error);
      }
    };
    
    video.onerror = (e) => {
      hasError = true;
      cleanup();
      console.error('Video error:', e);
      reject(new Error('Error loading video'));
    };
    
    // Start loading the video
    video.src = videoUrl;
  });
} 