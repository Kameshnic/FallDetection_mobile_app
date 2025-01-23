const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const hospitals = require('./data/hospitals');
const generateSensorData = require('./data/sensorData');

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

app.use(cors());
app.use(express.json());

let sensorDataIndex = 0;
let sensorData = generateSensorData(200);

io.on('connection', (socket) => {
    console.log('New client connected');
    
    const interval = setInterval(() => {
        if (sensorDataIndex < sensorData.length) {
            socket.emit('sensorData', sensorData[sensorDataIndex]);
            sensorDataIndex++;
        } else {
            sensorDataIndex = 0;
        }
    }, 1000);

    socket.on('disconnect', () => {
        console.log('Client disconnected');
        clearInterval(interval);
    });
});

app.post('/api/model/predict', (req, res) => {
    const { accelerometer, gyroscope, magnetometer } = req.body;
    const activity = predictActivity(accelerometer, gyroscope, magnetometer);
    res.json({ activity });
});

app.get('/api/hospitals/nearby', (req, res) => {
    // Limit the response to only the first 3 hospitals
    const nearbyHospitals = hospitals.slice(0, 3);
    
    // Send a message along with the hospital data and current location
    const message = "Calling the hospitals...";
    const userLocation = req.query.location || "Unknown location"; // Assuming the location is passed via query params

    res.json({
        message,
        nearbyHospitals,
        userLocation
    });
});

function predictActivity(accelerometer, gyroscope, magnetometer) {
    const { x, y, z } = accelerometer;

    if (z > 7) {
        return 'Fall Detected';
    }

    if (x > 2 && y > 2 && z < 3) {
        return 'Walking';
    }

    if (x > 4 && y > 4) {
        return 'Running';
    }

    if (x < 1 && y < 1 && z < 1) {
        return 'Sitting';
    }

    if (x < 2 && y < 2 && z > 3) {
        return 'Standing';
    }

    if (z > 10) {
        return 'Jumping';
    }

    return 'Sitting';
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
