const url = 'http://localhost:8080/api/v1';

async function verify() {
  console.log("Logging in as admin...");
  const loginRes = await fetch(`${url}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: "bakulisobur@gmail.com",
      password: "admin123"
    })
  });
  
  const loginData = await loginRes.json();
  if (!loginRes.ok) {
    console.error("Failed to login:", loginData);
    return;
  }
  const token = loginData.access_token || loginData.accessToken || loginData.token;
  if (!token) {
     console.error("Token missing in response:", loginData);
     return;
  }

  
  console.log(`Registered successfully. Token: ${token.substring(0, 20)}...`);
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  
  // 1. Check initial credits
  console.log("\nChecking initial AI credits...");
  const creditRes1 = await fetch(`${url}/ai/credits`, { headers });
  const creditData1 = await creditRes1.json();
  console.log("Initial credits:", creditData1.aiCreditsRemaining);
  
  // 2. Make an AI request (should fail due to invalid API key in .env)
  console.log("\nMaking AI request (expecting failure)...");
  const aiRes = await fetch(`${url}/ai/ask`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message: "Hello AI" })
  });
  const aiData = await aiRes.json();
  console.log("AI Response Status:", aiRes.status);
  console.log("AI Response Body:", aiData);
  
  // 3. Check credits again
  console.log("\nChecking AI credits after failed request...");
  const creditRes2 = await fetch(`${url}/ai/credits`, { headers });
  const creditData2 = await creditRes2.json();
  console.log("Credits after failure:", creditData2.aiCreditsRemaining);
  
  if (creditData1.aiCreditsRemaining === creditData2.aiCreditsRemaining) {
    console.log("\n✅ SUCCESS: Failed request did NOT consume a credit.");
  } else {
    console.log("\n❌ FAIL: Failed request consumed a credit!");
  }
}

verify().catch(console.error);
