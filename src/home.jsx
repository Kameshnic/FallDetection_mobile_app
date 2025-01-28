import React, { useState, useEffect } from 'react';
import './App.css';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:5000');

const Home = () => {
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
            <h1 style={{ fontSize: '3rem', fontWeight: 'bold', textAlign: 'center', color: '#4a90e2', marginBottom: '40px', textShadow: '2px 2px 5px rgba(0, 0, 0, 0.3)', }} >
            Fall Detection Live Dashboard
            </h1>

            {/* Sensor Data */}
            <div
            style={{ backgroundColor: '#e3f2fd', borderRadius: '12px', boxShadow: '0 8px 15px rgba(0, 0, 0, 0.2)', padding: '30px',paddingTop: '0px' ,margin: '20px auto', width: '80%', maxWidth: '600px', border: '2px solid #42a5f5', textAlign: 'center', }} >
            <h2 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '20px', color: '#1e88e5', }} >
                Sensor Data
            </h2>
            {sensorData ? (
                <pre style={{ fontSize: '1.2rem', padding: '20px',backgroundColor: '#8cb8ed', color: '#757575', borderRadius: '8px', overflow: 'auto', boxShadow: 'inset 0 4px 6px rgba(0, 0, 0, 0.1)', textAlign: 'left', whiteSpace: 'pre-wrap', wordWrap: 'break-word',}}>
                    {JSON.stringify(sensorData, null, 2)}
                </pre>
            ) : (
                <p style={{ fontSize: '1.5rem', color: '#757575', fontStyle: 'italic', }} >
                    Loading sensor data...
                </p>
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

export default Home