const fetch = require('node-fetch');

async function testEndpoints() {
    try {
        console.log("1. Logging in...");
        const loginRes = await fetch('http://localhost:8080/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'abdulsobur1921@gmail.com', password: 'Password123!' })
        });
        const loginData = await loginRes.json();
        const token = loginData.accessToken;
        console.log("Token received.");

        console.log("\n2. Getting jobs list to find an ID...");
        const jobsRes = await fetch('http://localhost:8080/api/v1/jobs?page=0&size=5', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const jobsData = await jobsRes.json();
        const firstJobId = jobsData.content[0].id;
        console.log(`Found job ID: ${firstJobId}`);

        console.log(`\n3. Toggling save for job ${firstJobId}...`);
        const saveRes = await fetch(`http://localhost:8080/api/v1/jobs/${firstJobId}/save`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const saveData = await saveRes.json();
        console.log("Save Response:", saveData);

        console.log("\n4. Getting saved jobs...");
        const savedJobsRes = await fetch('http://localhost:8080/api/v1/jobs/saved', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const savedJobsData = await savedJobsRes.json();
        console.log("Saved Jobs Count:", savedJobsData.length);
        if (savedJobsData.length > 0) {
            console.log("First Saved Job ID:", savedJobsData[0].id);
        }

        console.log(`\n5. Generating tailored CV for job ${firstJobId}...`);
        const cvRes = await fetch(`http://localhost:8080/api/v1/jobs/${firstJobId}/generate-cv`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const cvData = await cvRes.json();
        console.log("Tailored CV Response:", cvData.success ? "SUCCESS" : "FAILED");
        console.log(cvData.message.substring(0, 500) + '...');
        
    } catch (err) {
        console.error(err);
    }
}

testEndpoints();
