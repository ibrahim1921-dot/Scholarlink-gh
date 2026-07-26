const fetch = require('node-fetch');

async function testTrackers() {
    try {
        const loginRes = await fetch('http://localhost:8080/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'abdulsobur1921@gmail.com', password: 'Password123!' })
        });
        
        const loginData = await loginRes.json();
        
        if (!loginData.accessToken) {
            console.error('Failed to login:', loginData);
            return;
        }
        
        const token = loginData.accessToken;
        
        const trackersRes = await fetch('http://localhost:8080/api/v1/trackers', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const trackersData = await trackersRes.json();
        console.log(JSON.stringify(trackersData, null, 2));
    } catch(e) {
        console.error(e);
    }
}

testTrackers();
