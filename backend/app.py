from flask import Flask, jsonify, request
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app);

lat = 51.4982
lon = -0.1207

#@app.route('/test', methods=['GET'])
#def get_test():
    #try:
        #response = requests.get(f"https://api.openweathermap.org/data/3.0/onecall?lat={lat}&lon={lon}&appid={api_key}")
        #data = response.json();
        #return jsonify(data);
    #except Exception as e:
        #return jsonify({"error": str(e)}), 500
    
@app.route('/squirrels', methods=['GET'])
def get_squirrels():
    try:
        response = requests.get(f"https://data.cityofnewyork.us/resource/vfnx-vebw.json")
        data = response.json();
        print(len(data))
        return jsonify(data);
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/water-cons', methods=['GET'])
def get_water_consumption():
    try:
        response = requests.get(f"https://data.cityofnewyork.us/resource/ia2d-e54m.json")
        data = response.json();
        print(len(data))
        return jsonify(data);
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)