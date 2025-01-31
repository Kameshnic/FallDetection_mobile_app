import React, { useState, useEffect } from 'react';
import './App.css';

const Home = () => {
    const [sensorData, setSensorData] = useState(null);
    const [activity, setActivity] = useState('');
    const [fallDetected, setFallDetected] = useState(false);
    const [hospitals, setHospitals] = useState([]);
    const [loadingHospitals, setLoadingHospitals] = useState(true);
    const [userLocation, setUserLocation] = useState(null);

    useEffect(() => {
        // Get the user's current location
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ latitude, longitude });

                // Fetch nearby hospitals
                fetchNearbyHospitals(latitude, longitude);
            },
            (error) => {
                console.error('Error getting location:', error);
                setLoadingHospitals(false);
            }
        );

        // Fetch sensor data every 3 seconds
        const interval = setInterval(() => {
            fetchSensorData();
        }, 3000);

        return () => clearInterval(interval); // Cleanup interval on unmount
    }, []);

    const fetchSensorData = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/sensorData');
            if (!response.ok) throw new Error('Failed to fetch sensor data');
            const data = await response.json();
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
        } catch (error) {
            console.error('Error fetching sensor data:', error);
        }
    };

    const fetchNearbyHospitals = async (latitude, longitude) => {
        try {
            const response = await fetch(`http://localhost:5000/api/hospital/nearby?latitude=${latitude}&longitude=${longitude}`);
            if (!response.ok) throw new Error('Failed to fetch hospitals');
            const data = await response.json();
            setHospitals(data.nearbyHospitals || []);
        } catch (error) {
            console.error('Error fetching hospitals:', error);
        } finally {
            setLoadingHospitals(false);
        }
    };

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
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', textAlign: 'center', color: '#4a90e2', marginBottom: '10px',marginTop: '10px',textShadow: '2px 2px 5px rgba(0, 0, 0, 0.3)' }}>
                Fall Detection Live Dashboard
            </h1>
            <div style={{display:'flex',gap:'30px',marginBottom:'-20px',flexWrap: 'wrap'}}>
            {/* Sensor Data */}
            <div style={{ backgroundColor: '#e3f2fd', borderRadius: '12px', boxShadow: '0 8px 15px rgba(0, 0, 0, 0.2)', padding: '20px', paddingTop: '0px', margin: '20px auto',marginTop:'0px', width: '100%', maxWidth: '600px', maxHeight: '1200px', border: '2px solid #42a5f5', textAlign: 'center', flex: '1' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: '600', color: '#1e88e5', marginTop: '0px', marginBottom: '-20px' }}>
                    Sensor Data
                </h2>
                {sensorData ? (
                    <pre style={{ fontSize: '1.2rem', padding: '20px', backgroundColor: '#8cb8ed', color: '#757575', borderRadius: '8px', overflow: 'auto', boxShadow: 'inset 0 4px 6px rgba(0, 0, 0, 0.1)', textAlign: 'left', whiteSpace: 'pre-wrap', wordWrap: 'break-word', marginBottom: '0px' }}>
                        {JSON.stringify(sensorData, null, 2)}
                    </pre>
                ) : (
                    <p style={{ fontSize: '1.5rem', color: '#757575', fontStyle: 'italic' }}>
                        Loading sensor data...
                    </p>
                )}
            </div>

            <div>
            <div className={`activity-card ${fallDetected ? 'fall' : ''}`} style={{width:'420px',height:'100px',borderRadius:'20px'}}>
                <h2 style={{margin:'10px'}}>Predicted Activity: {activity}</h2>
                {fallDetected && (
                    <h2 className="fall-alert" style={{margin   :'5px'}}>⚠️ Fall Detected! Alarm Triggered!</h2>
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

            {/* Display User Location */}
            {userLocation && (
                <div className="location-card">
                    <h2>Your Current Location</h2>
                    <p>Latitude: {userLocation.latitude}</p>
                    <p>Longitude: {userLocation.longitude}</p>
                </div>
            )}
            </div>
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

export default Home;