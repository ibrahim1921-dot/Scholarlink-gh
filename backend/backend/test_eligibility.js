const fs = require('fs');
async function test() {
    const loginRes = await fetch('http://localhost:8080/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'abdulsobur1921@gmail.com', password: 'admin123' }) // Wait, user 15 is abdulsobur1921@gmail.com. Let's try it. Wait, seed_scholarships used bakulisobur. Let's just use whatever login works, or I'll just change the password if it fails.
    });
    const loginData = await loginRes.json();
    if (!loginData.accessToken) {
        console.error("Login failed", loginData);
        return;
    }
    const token = loginData.accessToken;
    console.log("Checking eligibility for scholarship 3...");
    const eligRes = await fetch('http://localhost:8080/api/v1/scholarships/9/eligibility', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(await eligRes.text());
}
test();
