async function testCreateTrackerEmpty() {
    try {
        const loginRes = await fetch('http://localhost:8080/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'abdulsobur1921@gmail.com',
                password: 'Password123!'
            })
        });
        const loginData = await loginRes.json();
        const token = loginData.accessToken;
        
        console.log("Logged in with token");

        // ONLY scholarshipId
        const payload = {
            scholarshipId: 2
        };

        const postRes = await fetch('http://localhost:8080/api/v1/trackers', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify(payload)
        });
        const postData = await postRes.text();
        
        console.log('POST Response status:', postRes.status);
        console.log('POST Response body:', postData);
    } catch (e) {
        console.error(e.message);
    }
}
testCreateTrackerEmpty();
