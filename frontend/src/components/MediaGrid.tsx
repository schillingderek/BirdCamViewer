import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMedia } from '../services/api';
import { LoadingSpinner } from './LoadingSpinner';
import { getCachedThumbnail, generateVideoThumbnail } from '../services/thumbnailCache';

interface MediaFile {
  name: string;
  url: string;
}

function getDateFromFilename(filename: string, isVideo: boolean): string {
  if (isVideo) {
    const timestamp = parseInt(filename.split('.')[0]);
    const date = new Date(timestamp * 1000);
    return date.toISOString().split('T')[0];
  } else {
    const dateStr = filename.substring(0, 8);
    return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
  }
}

const DateHeader = ({ date }: { date: string }) => {
  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);

  return (
    <div className="date-header">
      {dateObj.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}
    </div>
  );
};

interface MediaGridProps {
  folder: string;
  filterSpecies?: string;
  onLoadingChange?: (loading: boolean) => void;
}

export default function MediaGrid({ folder, filterSpecies, onLoadingChange }: MediaGridProps) {
  const [media, setMedia] = useState<{ date: string; items: MediaFile[] }[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [thumbnails, setThumbnails] = useState<{ [key: string]: string }>({});
  const ITEMS_PER_PAGE = 15;
  const navigate = useNavigate();
  const isVideo = folder === 'videos';
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
    setMedia([]);
    setHasMore(true);
    loadMedia();
  }, [folder, filterSpecies]);

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  const generateThumbnailsForBatch = async (items: MediaFile[]) => {
    const batchSize = 3; // Process 3 videos at a time
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (item) => {
          if (thumbnails[item.url]) return; // Skip if already has thumbnail
          
          try {
            const cachedThumbnail = await getCachedThumbnail(item.url);
            if (cachedThumbnail) {
              setThumbnails(prev => ({ ...prev, [item.url]: cachedThumbnail }));
            } else {
              const thumbnail = await generateVideoThumbnail(item.url);
              setThumbnails(prev => ({ ...prev, [item.url]: thumbnail }));
            }
          } catch (error) {
            console.error('Error generating thumbnail for', item.name, ':', error);
            setThumbnails(prev => ({ 
              ...prev, 
              [item.url]: 'https://via.placeholder.com/150?text=Video' 
            }));
          }
        })
      );
    }
  };

  const loadMedia = async () => {
    if (!hasMore || loading) return;
    
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching media for:', folder);
      const files = await fetchMedia(folder as 'images' | 'videos');
      console.log('Received files:', files);
      
      let filteredFiles = files;
      if (filterSpecies) {
        filteredFiles = files.filter((file: MediaFile) => 
          file.name.toLowerCase().includes(filterSpecies.toLowerCase())
        );
        console.log('Filtered files:', filteredFiles);
      }

      // Sort files by date
      filteredFiles.sort((a: MediaFile, b: MediaFile) => {
        if (isVideo) {
          const timestampA = parseInt(a.name.split('.')[0]);
          const timestampB = parseInt(b.name.split('.')[0]);
          return timestampB - timestampA;
        } else {
          const dateA = a.name.substring(0, 15);
          const dateB = b.name.substring(0, 15);
          return dateB.localeCompare(dateA);
        }
      });

      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const newItems = filteredFiles.slice(startIndex, endIndex);

      // Group items by date
      const groupedItems = newItems.reduce((acc: { [key: string]: MediaFile[] }, item) => {
        const date = getDateFromFilename(item.name, isVideo);
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(item);
        return acc;
      }, {});

      const groupedArray = Object.entries(groupedItems).map(([date, items]) => ({
        date,
        items
      }));

      setMedia(prev => [...prev, ...groupedArray]);
      setHasMore(endIndex < filteredFiles.length);
      setPage(prev => prev + 1);

      // Generate thumbnails for videos in batches
      if (isVideo) {
        await generateThumbnailsForBatch(newItems);
      }
    } catch (error) {
      setError('Failed to load media. Please try again.');
      console.error('Error in loadMedia:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      loadMedia();
    }
  };

  if (loading && media.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="media-grid" onScroll={handleScroll}>
      {media.map((item) => (
        <div key={item.date + item.items[0].name}>
          <DateHeader date={item.date} />
          <div className="media-items">
            {item.items.map((mediaItem) => (
              <div
                key={mediaItem.name}
                className="media-item"
                onClick={() => navigate(`/viewer?url=${encodeURIComponent(mediaItem.url)}&type=${folder}`)}
              >
                {isVideo ? (
                  <img
                    src={thumbnails[mediaItem.url] || 'https://via.placeholder.com/150?text=Video'}
                    alt={mediaItem.name}
                    className="thumbnail"
                    loading="lazy"
                  />
                ) : (
                  <img
                    src={mediaItem.url}
                    alt={mediaItem.name}
                    className="thumbnail"
                    loading="lazy"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      {loading && <LoadingSpinner />}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
} 