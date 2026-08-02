async function testProfile() {
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

        const profileRes = await fetch('http://localhost:8080/api/v1/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const profileText = await profileRes.text();
        console.log("GET /api/v1/profile response:", profileText);
    } catch (e) {
        console.error(e);
    }
}
testProfile();
