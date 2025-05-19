import { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator, TouchableOpacity, Image, Text } from 'react-native';
import { fetchGCSFiles } from '../utils/gcsHelper';
import { useRouter } from 'expo-router';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MediaFile {
  name: string;
  url: string;
}

function getDateFromFilename(filename: string, isVideo: boolean): string {
  if (isVideo) {
    // For videos, convert Unix timestamp to date
    const timestamp = parseInt(filename.split('.')[0]);
    const date = new Date(timestamp * 1000);
    console.log('Video timestamp:', timestamp, 'Filename:', filename, 'Date:', date.toISOString());
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
  } else {
    // For images, parse the date from filename (e.g., "20250313_100536_bird_annotated.jpg")
    const dateStr = filename.substring(0, 8); // Get "20250313"
    return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
  }
}

const DateHeader = ({ date }: { date: string }) => {
  // Parse the date string directly instead of creating a new Date object
  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day); // month is 0-based in JS Date

  return (
    <View style={{
      padding: 10,
      backgroundColor: '#f8f8f8',
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    }}>
      <Text style={{
        fontSize: 16,
        fontWeight: 'bold',
        color: '#666',
      }}>
        {dateObj.toLocaleDateString('en-US', { 
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </Text>
    </View>
  );
};

export default function MediaGrid({ folder, filterSpecies }: { folder: string, filterSpecies?: string }) {
  // console.log('MediaGrid component rendering with folder:', folder);
  const [media, setMedia] = useState<{ date: string; items: MediaFile[] }[]>([]);
  const [thumbnails, setThumbnails] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 15;
  const router = useRouter();
  const isVideo = folder === 'videos';

  useEffect(() => {
    // console.log('useEffect triggered with folder:', folder, 'filterSpecies:', filterSpecies);
    // console.log('Current state - loading:', loading, 'hasMore:', hasMore);
    setPage(1);
    setMedia([]);
    setHasMore(true);
    loadMedia();
  }, [folder, filterSpecies]);

  const loadMedia = async () => {
    if (!hasMore || loading) {
      return;
    }
    
    setLoading(true);
    try {
      const bucketName = isVideo ? 'bird_cam_videos' : 'bird_cam_images';
      const files = await fetchGCSFiles(bucketName);
      
      let filteredFiles = files;
      if (filterSpecies) {
        filteredFiles = files.filter((file: MediaFile) => 
          file.name.toLowerCase().includes(filterSpecies.toLowerCase())
        );
      }

      // Sort files by date
      filteredFiles.sort((a, b) => {
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
      const groupedItems = newItems.reduce((acc, item) => {
        const date = getDateFromFilename(item.name, isVideo);
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(item);
        return acc;
      }, {} as { [key: string]: MediaFile[] });

      // Convert to array of { date, items } pairs
      const groupedArray = Object.entries(groupedItems).map(([date, items]) => ({
        date,
        items
      }));

      setMedia(prev => {
        const updated = [...prev, ...groupedArray];
        return updated;
      });
      setHasMore(endIndex < filteredFiles.length);
      setPage(prev => prev + 1);

      if (isVideo) {
        newItems.forEach(async (file: MediaFile) => {
          const cachedThumbnail = await getCachedThumbnail(file.name);
          if (cachedThumbnail) {
            setThumbnails((prev) => ({ ...prev, [file.name]: cachedThumbnail }));
          } else {
            generateAndCacheThumbnail(file);
          }
        });
      }
    } catch (error) {
      console.error('Error in loadMedia:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadMedia();
    }
  };

  async function getCachedThumbnail(videoName: string): Promise<string | null> {
    try {
      const cachedUri = await AsyncStorage.getItem(`thumbnail_${videoName}`);
      if (cachedUri) {
        const fileInfo = await FileSystem.getInfoAsync(cachedUri);
        if (fileInfo.exists) {
          return cachedUri;
        }
      }
    } catch (error) {
      console.error("Error retrieving cached thumbnail:", error);
    }
    return null;
  }

  async function generateAndCacheThumbnail(file: MediaFile) {
    try {
      console.log('Starting thumbnail generation for:', file.name);
      const thumbnailResult = await VideoThumbnails.getThumbnailAsync(file.url, { 
        time: 5000,
        quality: 0.5  // Add quality parameter to reduce size
      });
      
      if (!thumbnailResult || !thumbnailResult.uri) {
        console.warn(`Failed to generate thumbnail for ${file.name}: No URI returned`);
        return;
      }
      
      console.log('Generated thumbnail URI:', thumbnailResult.uri);
      
      // Create a local file path in the app's cache directory
      const localUri = `${FileSystem.cacheDirectory}${file.name}.jpg`;
      
      try {
        // Download the thumbnail to our cache directory
        const downloadResult = await FileSystem.downloadAsync(thumbnailResult.uri, localUri);
        console.log('Downloaded thumbnail to:', downloadResult.uri);
        
        // Use the local URI for the thumbnail
        setThumbnails((prev) => ({ ...prev, [file.name]: downloadResult.uri }));
        
        // Cache the local URI for future use
        await AsyncStorage.setItem(`thumbnail_${file.name}`, downloadResult.uri);
      } catch (downloadError) {
        console.warn(`Failed to download thumbnail for ${file.name}:`, downloadError);
        // If download fails, try using the original URI
        setThumbnails((prev) => ({ ...prev, [file.name]: thumbnailResult.uri }));
      }
    } catch (error) {
      console.warn(`Failed to generate thumbnail for ${file.name}:`, error);
      // Set a placeholder image for failed thumbnails
      setThumbnails((prev) => ({ 
        ...prev, 
        [file.name]: 'https://via.placeholder.com/110?text=Video' 
      }));
    }
  }

  if (loading && media.length === 0) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={media}
        keyExtractor={(item) => item.date + item.items[0].name}
        numColumns={1}
        contentContainerStyle={{ padding: 10 }}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.9}
        ListFooterComponent={() => 
          loading ? <ActivityIndicator size="small" style={{ padding: 10 }} /> : null
        }
        style={{ flex: 1 }}
        renderItem={({ item }) => (
          <View>
            <DateHeader date={item.date} />
            <View style={{ 
              flexDirection: 'row', 
              flexWrap: 'wrap',
              justifyContent: 'flex-start',
              width: '100%'
            }}>
              {item.items.map((mediaItem) => (
                <TouchableOpacity
                  key={mediaItem.name}
                  onPress={() => router.push({ pathname: '/viewer', params: { url: mediaItem.url, type: folder } })}
                  style={{ 
                    margin: 5, 
                    position: 'relative',
                    width: '30%',
                    aspectRatio: 1,
                    backgroundColor: '#f0f0f0',
                    borderRadius: 10,
                    overflow: 'hidden'
                  }}
                >
                  <View style={{ width: '100%', height: '100%' }}>
                    {isVideo ? (
                      <Image
                        source={{ uri: thumbnails[mediaItem.name] || 'https://via.placeholder.com/110?text=Video' }}
                        style={{ 
                          width: '100%',
                          height: '100%',
                          borderRadius: 10
                        }}
                        resizeMode="cover"
                        onError={(e) => {
                          console.error('Video thumbnail error:', e.nativeEvent.error, 'URL:', thumbnails[mediaItem.name]);
                          setThumbnails((prev) => ({ 
                            ...prev, 
                            [mediaItem.name]: 'https://via.placeholder.com/110?text=Video' 
                          }));
                        }}
                        onLoad={() => console.log('Video thumbnail loaded:', mediaItem.name)}
                      />
                    ) : (
                      <Image
                        source={{ uri: mediaItem.url }}
                        style={{ 
                          width: '100%',
                          height: '100%',
                          borderRadius: 10
                        }}
                        resizeMode="cover"
                        onError={(e) => console.error('Image error:', e.nativeEvent.error, 'URL:', mediaItem.url)}
                        onLoad={() => console.log('Image loaded:', mediaItem.name)}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      />
    </View>
  );
}
