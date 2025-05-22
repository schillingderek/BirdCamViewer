import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function MediaViewer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const url = searchParams.get('url');
  const type = searchParams.get('type');

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Handle escape key to close viewer
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate(-1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate]);

  if (!url || !type) {
    return <div>Invalid media URL</div>;
  }

  return (
    <div className="media-viewer">
      <button 
        className="close-button"
        onClick={() => navigate(-1)}
        aria-label="Close viewer"
      >
        ×
      </button>

      {type === 'videos' ? (
        <div className="video-container">
          <video
            src={url}
            controls
            autoPlay
            loop
            className="video-player"
            onDoubleClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
                setIsFullscreen(true);
              } else {
                document.exitFullscreen();
                setIsFullscreen(false);
              }
            }}
          />
        </div>
      ) : (
        <div className="image-container">
          <img 
            src={url} 
            alt="Full size view" 
            className="full-image"
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
                setIsFullscreen(true);
              } else {
                document.exitFullscreen();
                setIsFullscreen(false);
              }
            }}
          />
        </div>
      )}
    </div>
  );
} 