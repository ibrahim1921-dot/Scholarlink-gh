const fs = require('fs');

async function main() {
    // 1. Login
    const loginRes = await fetch('http://localhost:8080/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'bakulisobur@gmail.com', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    if (!loginData.accessToken) {
        console.error('Failed to login:', loginData);
        return;
    }
    const token = loginData.accessToken;
    console.log('Got token:', token.substring(0, 10) + '...');

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // 2. Update a few scholarships
    const idsToUpdate = [11, 10, 9];
    
    for (const id of idsToUpdate) {
        // Fetch current
        const getRes = await fetch(`http://localhost:8080/api/v1/scholarships/${id}`, { headers });
        if (!getRes.ok) {
            console.error(`Failed to get scholarship ${id}:`, await getRes.text());
            continue;
        }
        const scholarship = await getRes.json();
        
        // Modify
        scholarship.allowsAssistedApplication = true;
        scholarship.assistedApplicationFee = 50.0;
        
        // PUT back
        const putRes = await fetch(`http://localhost:8080/api/v1/scholarships/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(scholarship)
        });
        
        if (putRes.ok) {
            console.log(`Successfully updated scholarship ${id}`);
        } else {
            console.error(`Failed to update scholarship ${id}:`, await putRes.text());
        }
    }
}

main().catch(console.error);
