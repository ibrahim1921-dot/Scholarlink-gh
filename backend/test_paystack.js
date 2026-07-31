const fetch = require('node-fetch');
const crypto = require('crypto');

const BASE_URL = 'http://localhost:8080/api/v1';

async function runTests() {
    console.log("=== STARTING TESTS ===\n");

    // 1. Login
    console.log("Logging in as student...");
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'abdulsobur1921@gmail.com', password: 'Password123!' })
    });
    const loginData = await loginRes.json();
    const token = loginData.accessToken;
    console.log(`Token obtained.\n`);

    // Fetch user profile for initial credits
    const profileRes = await fetch(`${BASE_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const profileData = await profileRes.json();
    console.log(`Initial AI Credits: ${profileData.aiCreditsRemaining}\n`);

    // 2. Initialize AI Credit Purchase
    console.log("Initializing AI Credit Purchase...");
    const creditInitRes = await fetch(`${BASE_URL}/payments/ai-credits/initialize`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const creditInitData = await creditInitRes.json();
    console.log(`Credit Purchase Ref: ${creditInitData.reference}`);
    console.log(`Credit Purchase URL: ${creditInitData.authorizationUrl}\n`);
    
    // Status before
    const statusBefore = await fetch(`${BASE_URL}/payments/${creditInitData.reference}/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`Status before purchase: ${JSON.stringify(await statusBefore.json())}\n`);

    // 3. Initialize Assisted Application Fee
    console.log("Initializing Assisted Application Fee (for job ID 1)...");
    const appInitRes = await fetch(`${BASE_URL}/payments/assisted-application/initialize`, {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ listingType: 'JOB', listingId: 1 })
    });
    const appInitData = await appInitRes.json();
    console.log(`App Fee Ref: ${appInitData.reference}`);
    console.log(`App Fee URL: ${appInitData.authorizationUrl}\n`);

    // 4. Test Webhook Rejection
    console.log("Testing Webhook with bad signature...");
    const badWebhookRes = await fetch(`${BASE_URL}/payments/webhook`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'x-paystack-signature': 'garbage123456789'
        },
        body: JSON.stringify({ event: 'charge.success', data: { reference: creditInitData.reference } })
    });
    console.log(`Bad Webhook Response Status: ${badWebhookRes.status}`);
    console.log(`Bad Webhook Response Body: ${await badWebhookRes.text()}\n`);

}

runTests().catch(console.error);
