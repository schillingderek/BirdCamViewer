const API_URL = 'http://localhost:5050';

export interface MediaFile {
  name: string;
  url: string;
  size?: number;
  updated?: string;
}

export const fetchMedia = async (type: 'images' | 'videos'): Promise<MediaFile[]> => {
  try {
    console.log('Fetching from:', `${API_URL}/api/media/${type}`);
    const response = await fetch(`${API_URL}/api/media/${type}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('API response:', data);
    return data;
  } catch (error) {
    console.error('Error fetching media:', error);
    return [];
  }
}; 