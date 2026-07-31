async function testPut() {
    try {
        const loginRes = await fetch('http://localhost:8080/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'bakulisobur@gmail.com',
                password: 'admin123'
            })
        });
        const loginData = await loginRes.json();
        const token = loginData.accessToken;

        // Fetch scholarship 11
        const getRes = await fetch('http://localhost:8080/api/v1/scholarships/11', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const scholarship = await getRes.json();

        // Update to sponsored
        const payload = {
            ...scholarship,
            sponsored: true,
            sponsorName: 'Test Sponsor'
        };

        const putRes = await fetch('http://localhost:8080/api/v1/scholarships/11', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify(payload)
        });
        const putData = await putRes.json();

        console.log('PUT Response sponsored:', putData.sponsored);

        // Fetch again to verify
        const getRes2 = await fetch('http://localhost:8080/api/v1/scholarships/11', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const getRes2Data = await getRes2.json();
        console.log('GET after PUT sponsored:', getRes2Data.sponsored);
    } catch (e) {
        console.error(e.message);
    }
}
testPut();
