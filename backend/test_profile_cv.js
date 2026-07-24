const fetch = require('node-fetch');

async function testEndpoints() {
    try {
        console.log("1. Logging in as admin...");
        const loginRes = await fetch('http://localhost:8080/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'bakulisobur@gmail.com', password: 'admin123' })
        });
        const loginData = await loginRes.json();
        const token = loginData.accessToken;
        console.log("Token received.");

        console.log("\n2. Updating profile...");
        const profilePayload = {
            education_level: "UNIVERSITY_GRADUATE",
            gpa: 3.8,
            field_of_study: "Computer Science",
            institution: "University of Ghana",
            graduation_year: 2024,
            country_preference: "USA",
            language_proficiency: "English (Native), French (Basic)",
            standardized_tests: "GRE: 320",
            bio: "Passionate software engineer with a knack for solving complex problems.",
            achievements: "Winner of 2023 National Hackathon."
        };
        const profileRes = await fetch('http://localhost:8080/api/v1/profile', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(profilePayload)
        });
        console.log("Profile updated status:", profileRes.status);

        console.log("\n3. Getting jobs list to find an ID...");
        const jobsRes = await fetch('http://localhost:8080/api/v1/jobs?page=0&size=5', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const jobsData = await jobsRes.json();
        
        let targetJobId;
        if (!jobsData.content || jobsData.content.length === 0) {
            console.log("No jobs found. Creating a job...");
            const job = { 
                title: "Software Eng", 
                company: "Google", 
                description: "We are looking for a software engineer to build scalable backend systems.", 
                location: "NY", 
                fieldOfStudy: "CS", 
                requiredEducationLevel: "UNIVERSITY_GRADUATE", 
                requirements: "Java, Spring Boot, React, 3 years experience", 
                applicationDeadline: "2026-12-31T00:00:00"
            };
            const jobRes = await fetch('http://localhost:8080/api/v1/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(job)
            });
            const createdJob = await jobRes.json();
            targetJobId = createdJob.id;
        } else {
            targetJobId = jobsData.content[0].id;
        }
        
        console.log(`Found/Created job ID: ${targetJobId}`);

        console.log(`\n4. Generating tailored CV for job ${targetJobId}...`);
        const cvRes = await fetch(`http://localhost:8080/api/v1/jobs/${targetJobId}/generate-cv`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const cvData = await cvRes.json();
        console.log("Tailored CV Response:", cvData.success ? "SUCCESS" : "FAILED");
        console.log("\n--- GENERATED CV START ---\n");
        console.log(cvData.message);
        console.log("\n--- GENERATED CV END ---\n");
        
    } catch (err) {
        console.error(err);
    }
}

testEndpoints();
