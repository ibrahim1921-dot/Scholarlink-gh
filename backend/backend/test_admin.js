const baseUrl = 'http://localhost:8080/api/v1';

async function login(email, password) {
    const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    return data.accessToken;
}

async function makeRequest(endpoint, method, token, body = null) {
    const options = {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);
    
    const res = await fetch(`${baseUrl}${endpoint}`, options);
    let text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = text; }
    
    return { status: res.status, data };
}

async function run() {
    console.log("=== LOGGING IN ===");
    const adminToken = await login('bakulisobur@gmail.com', 'admin123');
    const studentToken = await login('sugarmundy@gmail.com', 'admin123');
    console.log("Admin token retrieved:", !!adminToken);
    console.log("Student token retrieved:", !!studentToken);
    
    console.log("\n=== 1. ADMIN PROMOTES STUDENT ===");
    let res = await makeRequest('/admin/users/15/promote', 'POST', adminToken);
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${JSON.stringify(res.data, null, 2)}`);
    
    console.log("\n=== 2. STUDENT PROMOTES STUDENT (Should be 403) ===");
    res = await makeRequest('/admin/users/8/promote', 'POST', studentToken);
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${JSON.stringify(res.data, null, 2)}`);

    console.log("\n=== 3. STUDENT GETS USERS (Should be 403) ===");
    res = await makeRequest('/admin/users', 'GET', studentToken);
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${JSON.stringify(res.data, null, 2)}`);

    console.log("\n=== 4. ADMIN GETS USERS ===");
    res = await makeRequest('/admin/users', 'GET', adminToken);
    console.log(`Status: ${res.status}`);
    console.log(`Response (first user): ${JSON.stringify(res.data.content ? res.data.content[0] : res.data, null, 2)}`);

    console.log("\n=== 5. ADMIN DEMOTES THEMSELVES (Not Last Admin, 15 is Admin) ===");
    // Wait, first let's see if 15 is admin now. (Step 1 promoted 15). So there are 2 admins.
    // If I demote 7 (bakulisobur), it should succeed because 15 is still admin! 
    // To test "last admin" failure, I must try to demote 15 after 7 is demoted, OR demote 15 first then 7.
    
    console.log("\n=== DEMOTING 15 (Succeeds) ===");
    res = await makeRequest('/admin/users/15/demote', 'POST', adminToken);
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${JSON.stringify(res.data, null, 2)}`);

    console.log("\n=== DEMOTING 7 (Fails because 7 is now the last admin) ===");
    res = await makeRequest('/admin/users/7/demote', 'POST', adminToken);
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${JSON.stringify(res.data, null, 2)}`);
    
    console.log("\n=== 7. ADMIN GETS ALL JOBS ===");
    res = await makeRequest('/jobs/admin/all', 'GET', adminToken);
    console.log(`Status: ${res.status}`);
    const jobBefore = res.data.content ? res.data.content[0] : null;
    console.log(`First job ID: ${jobBefore ? jobBefore.id : 'None'}`);

    if (jobBefore) {
        console.log(`\n=== 8. ADMIN DEACTIVATES JOB ${jobBefore.id} ===`);
        res = await makeRequest(`/jobs/${jobBefore.id}/deactivate`, 'PUT', adminToken);
        console.log(`Status: ${res.status}`);
        console.log(`Response: ${JSON.stringify(res.data, null, 2)}`);

        console.log("\n=== 9. STUDENT GETS ACTIVE JOBS (Should NOT include deactivated job) ===");
        res = await makeRequest('/jobs', 'GET', studentToken);
        const studentJobs = res.data.content || [];
        const found = studentJobs.find(j => j.id === jobBefore.id);
        console.log(`Status: ${res.status}`);
        console.log(`Job ${jobBefore.id} found in student list? ${!!found}`);
    }
}
run();
