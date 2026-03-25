/**
 * test-signup.js
 * Diagnostic script to test the OTP request phase of the registration flow.
 * It manually loads environment variables and makes a test request to the local server.
 */

const fs = require('fs');
const path = require('path');

// Manually load .env.local
try {
    const envPath = path.join(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim();
            if (key && !key.startsWith('#')) {
                process.env[key] = value;
            }
        }
    });
    console.log('Loaded .env.local manually');
} catch (e) {
    console.error('Failed to load .env.local:', e.message);
}

// Now run the test
async function testSignUp() {
    console.log('Testing /api/auth/request-otp...');
    // We can't actually run the API code here because it imports Next.js stuff
    // But we can check if the environments are loaded correctly for the manual test

    console.log('--- ENV CHECK ---');
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    console.log('SMTP_PORT:', process.env.SMTP_PORT);
    console.log('SMTP_USER:', process.env.SMTP_USER);
    console.log('SMTP_PASS exists:', !!process.env.SMTP_PASS);

    // Real test requests against the running server
    try {
        const response = await fetch('http://localhost:3000/api/auth/request-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                registrationNumber: '44113306',
                email: 'shreyassrinivasan2205@gmail.com',
            }),
        });

        const data = await response.json();
        console.log('Status:', response.status);
        if (data.error) {
            console.log('Error:', data.error);
            if (data.details) console.log('Details:', data.details);
        } else {
            console.log('Response:', data);
        }
    } catch (error) {
        console.error('Fetch Error:', error);
    }
}

testSignUp();
