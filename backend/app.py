import os
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import requests
import io
import logging

app = Flask(__name__)
CORS(app);

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

GOOGLE_STREET_VIEW_API_KEY = os.environ.get('GOOGLE_STREET_VIEW_API_KEY', 'API_KEY')

# https://maps.googleapis.com/maps/api/streetview?size=400x400&location=47.5763831,-122.4211769&fov=80&heading=70&pitch=0&key=YOUR_API_KEY&signature=YOUR_SIGNATURE

    # Expected JSON payload:
    # {
    #     "lat": 40.7128,
    #     "lng": -74.0060,
    #     "size": "640x640",  # Optional, defaults to 640x640
    #     "heading": 0,       # Optional, camera direction (0-360 degrees)
    #     "pitch": 0          # Optional, vertical angle (-90 to 90)
    # }

@app.route('/get_street_view', methods=['POST'])
def get_street_view_image():
    
    try:
        logger.debug(f"Received request headers: {request.headers}")
        logger.debug(f"Received request data: {request.get_json(silent=True)}")

        data = request.json;

        if not data or 'lat' not in data or 'lng' not in data:
            return jsonify({"error": "Lat and Lng are Required."}), 400
        
        lat = data["lat"]
        lng = data["lng"]

        if not data:
            logger.error("No data received")
            return jsonify({"error": "No data provided"}), 400
        
        try:
            lat = float(data.get('lat'))
            lng = float(data.get('lng'))
        except (TypeError, ValueError):
            logger.error(f"Invalid coordinates: {data}")
            return jsonify({"error": "Invalid latitude or longitude"}), 400
        
        size = '600x400'
        pitch = 0
        heading = 0
        fov = 100

        street_view_url = (
            f"https://maps.googleapis.com/maps/api/streetview?"
            f"size={size}"
            f"&location={lat},{lng}"
            f"&fov={fov}"
            f"&heading={heading}"
            f"&pitch={pitch}"
            f"&key={GOOGLE_STREET_VIEW_API_KEY}"
        )

        logger.debug(f"Street View URL: {street_view_url}")
        
        try:
            response = requests.get(street_view_url)
            
            if response.status_code != 200:
                return jsonify({
                    "error": "Could not fetch Street View image",
                    "status_code": response.status_code,
                    "details": response.text
                }), 400
            
            image_stream = io.BytesIO(response.content)
            image_stream.seek(0)
            
            return send_file(
                image_stream, 
                mimetype='image/jpeg'
            )
        
        except requests.RequestException as err:
            logger.error(f"Request to Street View API failed: {err}")
            return jsonify({"error": "Network error fetching Street View image"}), 500
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
if __name__ == '__main__':
    app.run(debug=True)