const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_API;
const generateSensorData = require('./data/sensorData');

const app = express();
app.use(cors());
app.use(express.json());

let sensorDataIndex = 0;
let sensorData = generateSensorData(200);

// API to get sensor data
app.get('/api/sensorData', (req, res) => {
    if (sensorDataIndex >= sensorData.length) {
        sensorDataIndex = 0;
    }
    res.json(sensorData[sensorDataIndex]);
    sensorDataIndex++;
});

// API to get nearby hospitals (using native fetch)
app.get('/api/hospitals/nearby', async (req, res) => {
    try {
        const { latitude, longitude } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({ error: "Latitude and longitude are required" });
        }

        const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/hospital.json?proximity=${longitude},${latitude}&limit=10&access_token=${MAPBOX_ACCESS_TOKEN}`;

        const response = await fetch(mapboxUrl);
        const data = await response.json();

        if (!data.features) {
            return res.status(500).json({ error: "Failed to fetch hospitals" });
        }

        const nearbyHospitals = data.features
            .map(hospital => ({
                name: hospital.text,
                address: hospital.place_name,
                coordinates: hospital.geometry.coordinates
            }))
            .slice(0, 3); // Limit to 3 hospitals

        res.json({ nearbyHospitals, userLocation: { latitude, longitude } });

    } catch (error) {
        console.error("Error fetching hospitals:", error);
        res.status(500).json({ error: "Failed to fetch nearby hospitals" });
    }
});

// API to predict activity based on sensor data
app.post('/api/model/predict', (req, res) => {
    const { accelerometer } = req.body;
    const activity = predictActivity(accelerometer);
    res.json({ activity });
});

// Activity prediction function
function predictActivity(accelerometer) {
    const { x, y, z } = accelerometer;

    if (z > 7) return 'Fall Detected';
    if (x > 2 && y > 2 && z < 3) return 'Walking';
    if (x > 4 && y > 4) return 'Running';
    if (x < 1 && y < 1 && z < 1) return 'Sitting';
    if (x < 2 && y < 2 && z > 3) return 'Standing';
    if (z > 10) return 'Jumping';

    return 'Sitting';
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});