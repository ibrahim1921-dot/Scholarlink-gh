async function testCreditsAndTransactions() {
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
        console.log("Logged in");

        // 1. GET /api/v1/ai/credits
        const creditsRes = await fetch('http://localhost:8080/api/v1/ai/credits', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const creditsText = await creditsRes.text();
        console.log("GET /api/v1/ai/credits response:", creditsRes.status, creditsText);

        // 2. GET /api/v1/payments/my-transactions
        const txRes = await fetch('http://localhost:8080/api/v1/payments/my-transactions', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const txText = await txRes.text();
        console.log("GET /api/v1/payments/my-transactions response:", txRes.status, txText);
    } catch (e) {
        console.error(e);
    }
}
testCreditsAndTransactions();
