from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from dotenv import load_dotenv
import os
import requests
import io
import logging
import base64
import uuid
from datetime import datetime
from azure.storage.blob import BlobServiceClient, BlobClient, ContainerClient
from azure.data.tables import TableClient, TableServiceClient, TableEntity
from azure.core.credentials import AzureNamedKeyCredential

load_dotenv()

app = Flask(__name__)
CORS(app);

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


# Azure Setup
AZURE_ACCESS_KEY = os.getenv("AZURE_ACCESS_KEY")
account_name = "shotspotterdb"
container_name = "streetviewimages"

blob_service_client = BlobServiceClient(
    account_url=f"https://{account_name}.blob.core.windows.net",
    credential=AZURE_ACCESS_KEY
)

table_service_client = TableServiceClient(
    endpoint=f"https://{account_name}.table.core.windows.net",
    credential=AzureNamedKeyCredential(account_name, AZURE_ACCESS_KEY)
)

# Street View API Setup
GOOGLE_STREET_VIEW_API_KEY = os.getenv("API_KEY")

# https://maps.googleapis.com/maps/api/streetview?size=400x400&location=47.5763831,-122.4211769&fov=80&heading=70&pitch=0&key=YOUR_API_KEY&signature=YOUR_SIGNATURE


@app.route('/get_image', methods=['GET'])
def get_image():
    try:
        data = request.json
        lat = data.get('lat')
        lng = data.get('lng')
        heading = data.get('heading')

        # access db on lat, lng condition
        # https://shotspotterdb.table.core.windows.net/streetviewmetadata

    except Exception as e:
        return jsonify({"error": e})
    
@app.route('/save_location', methods=['POST'])
def save_location():
    try:
        data = request.json
        lat = data.get('lat')
        lng = data.get('lng')
        heading = data.get('heading')
        image_data = data.get('imageData')

        try:
            image_binary = base64.b64decode(image_data.split(",")[1])
        except Exception as img_err:
            logger.error(f"Image decoding error: {str(img_err)}")
            return jsonify({"error": f"Failed to decode image: {str(img_err)}"}), 400

        image_name = f"streetview_{uuid.uuid4()}.jpg"

        try:
            container_client = blob_service_client.get_container_client(container_name)
            blob_client = container_client.get_blob_client(image_name)
            blob_client.upload_blob(image_binary, overwrite=True)
        except Exception as blob_err:
            logger.error(f"Blob storage error: {str(blob_err)}")
            return jsonify({"error": f"Blob storage error: {str(blob_err)}"}), 500

        image_url = f"https://{account_name}.blob.core.windows.net/{container_name}/{image_name}"

        # Insert metadata after blob storage complete
        def insert_image_metadata(lat, lng, heading, image_name, image_url):
            try:
                partition_key = "oldsn"
                row_key = str(datetime.now())
                metadata = {
                    "PartitionKey": partition_key,
                    "RowKey": row_key,
                    "Latitude": lat,
                    "Longitude": lng,
                    "Heading": heading,
                    "ImageName": image_name,
                    "ImageUrl": image_url
                }
                table_name = "streetviewmetadata"
                table_client = table_service_client.get_table_client(table_name)
                table_client.create_entity(metadata)
                print(f"Image metadata for: ", image_name, " added successfully.")
            except Exception as e:
                logger.error(f"Table storage error: {str(e)}")   
        
        insert_image_metadata(lat, lng, heading, image_name, image_url)

        return jsonify({
            "message": "Image saved successfully",
            "image_name": image_name,
            "image_url": image_url,
            "latitude": lat,
            "longitude": lng,
            "heading": heading
        }), 200

    except Exception as e:
        logger.error(f"Error in save_location: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
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
        data = request.json;

        if not data or 'lat' not in data or 'lng' not in data:
            return jsonify({"error": "Lat and Lng are Required."}), 400
        
        lat = data.get('lat')
        lng = data.get('lng')
        heading = data.get('heading')

        size = '600x400'
        pitch = 0
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