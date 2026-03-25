/**
 * inspect-facepp.js
 * Debugging script to inspect the Face++ library export and instance structure,
 * aiding in integration and troubleshooting face verification features.
 */

const FacePP = require('faceplusplus');

console.log('Type of FacePP export:', typeof FacePP);
console.log('FacePP export:', FacePP);

try {
    const facepp = new FacePP({
        apiKey: 'test',
        apiSecret: 'test'
    });
    console.log('Instance created successfully');
    console.log('Instance keys:', Object.keys(facepp));
    console.log('Instance prototype keys:', Object.getOwnPropertyNames(Object.getPrototypeOf(facepp)));
} catch (e) {
    console.log('Instantiation failed:', e.message);
}
