from flask import Flask, jsonify, Response, request
from flask_cors import CORS
import requests
import os
from urllib.parse import urlparse

app = Flask(__name__)

# Update CORS to allow all origins for development
CORS(app, resources={r"/api/*": {"origins": "*"}})


# Bucket names
BUCKET_NAMES = {
    'images': 'bird_cam_images',
    'videos': 'bird_cam_videos'
}

@app.route('/api/media/<media_type>')
def get_media(media_type):
    print(f"Received request for media type: {media_type}")  # Debug log
    if media_type not in BUCKET_NAMES:
        return jsonify({'error': 'Invalid media type'}), 400
    
    try:
        # Use the same direct GCS API endpoint as before
        print(f"Fetching from bucket: {BUCKET_NAMES[media_type]}")  # Debug log
        response = requests.get(f'https://storage.googleapis.com/storage/v1/b/{BUCKET_NAMES[media_type]}/o')
        print(f"Response status: {response.status_code}")  # Debug log
        data = response.json()
        
        if 'items' in data:
            files = []
            for item in data['items']:
                # Skip any non-media files or hidden files
                if item['name'].startswith('.') or not any(item['name'].lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.mp4']):
                    continue
                    
                # For videos, use our proxy endpoint
                if media_type == 'videos':
                    url = f'http://{request.host}/api/video/{item["name"]}'
                else:
                    url = f'https://storage.googleapis.com/{BUCKET_NAMES[media_type]}/{item["name"]}'
                    
                files.append({
                    'name': item['name'],
                    'url': url,
                    'size': item.get('size'),
                    'updated': item.get('updated')
                })
            
            print(f"Returning {len(files)} files")  # Debug log
            return jsonify(files)
        else:
            print("No items found in response")  # Debug log
            return jsonify([])
    
    except Exception as e:
        print(f"Error fetching media: {str(e)}")  # Debug log
        return jsonify({'error': 'Failed to fetch media'}), 500

@app.route('/api/video/<filename>')
def proxy_video(filename):
    try:
        # Get the video from GCS
        video_url = f'https://storage.googleapis.com/{BUCKET_NAMES["videos"]}/{filename}'
        response = requests.get(video_url, stream=True)
        
        if response.status_code != 200:
            return jsonify({'error': 'Video not found'}), 404
            
        # Stream the video with proper headers
        return Response(
            response.iter_content(chunk_size=8192),
            content_type=response.headers['content-type'],
            headers={
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Content-Disposition': f'inline; filename="{filename}"'
            }
        )
    except Exception as e:
        print(f"Error proxying video: {str(e)}")
        return jsonify({'error': 'Failed to fetch video'}), 500

@app.route('/api/health')
def health_check():
    return jsonify({'status': 'healthy'})

@app.route('/api/test')
def test():
    return jsonify({"message": "API is working"})

if __name__ == '__main__':
    print("Starting Flask server...")  # Debug log
    app.run(debug=True, port=5050) 