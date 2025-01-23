import React, { useState, useEffect } from 'react';
import './App.css';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:5000');

function App() {
    const [sensorData, setSensorData] = useState(null);
    const [activity, setActivity] = useState('');
    const [fallDetected, setFallDetected] = useState(false);
    const [hospitals, setHospitals] = useState([]);
    const [loadingHospitals, setLoadingHospitals] = useState(true);

    useEffect(() => {
        socket.on('sensorData', (data) => {
            setSensorData(data);
            const predictedActivity = predictActivity(data);
            setActivity(predictedActivity);

            if (predictedActivity === 'Fall Detected') {
                setFallDetected(true);
                const audio = new Audio('/fall_alarm.mp3');
                audio.play();
            } else {
                setFallDetected(false);
            }
        });

        axios
            .get('http://localhost:5000/api/hospitals/nearby')
            .then((response) => {
                setHospitals(Array.isArray(response.data) ? response.data : []);
                setLoadingHospitals(false);
            })
            .catch((error) => {
                console.error('Error fetching hospitals:', error);
                setLoadingHospitals(false);
            });

        return () => {
            socket.off('sensorData');
        };
    }, []);

    const predictActivity = (data) => {
        if (data.accelerometer.z > 5) {
            return 'Fall Detected';
        }
        if (data.accelerometer.x > 2 && data.accelerometer.y > 2) {
            return 'Walking';
        }
        return 'Sitting';
    };

    return (
        <div className="App">
            <h1 className="title">Fall Detection Live Dashboard</h1>

            {/* Sensor Data */}
            <div className="card sensor-card">
                <h2>Sensor Data</h2>
                {sensorData ? (
                    <pre>{JSON.stringify(sensorData, null, 2)}</pre>
                ) : (
                    <p>Loading sensor data...</p>
                )}
            </div>

            {/* Predicted Activity */}
            <div className={`activity-card ${fallDetected ? 'fall' : ''}`}>
                <h2>Predicted Activity: {activity}</h2>
                {fallDetected && (
                    <h2 className="fall-alert">⚠️ Fall Detected! Alarm Triggered!</h2>
                )}
            </div>

            {/* Nearby Hospitals */}
            <div className="card hospital-card">
                <h2>Nearby Hospitals</h2>
                {loadingHospitals ? (
                    <div className="loading-spinner">Loading hospitals...</div>
                ) : hospitals.length === 0 ? (
                    <p>No hospitals found nearby.</p>
                ) : (
                    <ul>
                        {hospitals.map((hospital) => (
                            <li key={hospital.id} className="hospital-item">
                                <strong>{hospital.name}</strong>
                                <p>{hospital.address}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Button to manually trigger an alarm for testing */}
            <div className="button-container">
                <button
                    className="test-fall-button"
                    onClick={() => {
                        setFallDetected(true);
                        const audio = new Audio('/fall_alarm.mp3');
                        audio.play();
                    }}
                >
                    Test Fall Detection
                </button>
            </div>
        </div>
    );
}

export default App;
