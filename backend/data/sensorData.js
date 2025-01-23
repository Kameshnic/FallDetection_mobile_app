// sensorData.js
function generateSensorData(count) {
    const data = [];
    for (let i = 0; i < count; i++) {
        data.push({
            accelerometer: {
                x: Math.random() * 10,
                y: Math.random() * 10,
                z: Math.random() * 10,
            },
            gyroscope: {
                x: Math.random() * 10,
                y: Math.random() * 10,
                z: Math.random() * 10,
            },
            magnetometer: {
                x: Math.random() * 10,
                y: Math.random() * 10,
                z: Math.random() * 10,
            },
        });
    }
    return data;
}

module.exports = generateSensorData;
