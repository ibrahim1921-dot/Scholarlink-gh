async function testFrontendPayload() {
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

        // Exact payload like frontend
        const formData = {
            name: scholarship.name || "",
            provider: scholarship.provider || "",
            category: scholarship.category || "GENERAL",
            destinationCountry: scholarship.destinationCountry || "",
            eligibleFields: scholarship.eligibleFields || "",
            gpaRequirement: scholarship.gpaRequirement !== null ? String(scholarship.gpaRequirement) : "",
            fundingCoverage: scholarship.fundingCoverage || "",
            deadline: scholarship.deadline || "",
            officialLink: scholarship.officialLink || "",
            requirements: scholarship.requirements || "",
            selectionCriteria: scholarship.selectionCriteria || "",
            additionalNotes: scholarship.additionalNotes || "",
            imageUrl: scholarship.imageUrl || "",
            status: scholarship.status || "OPEN",
            allowsAssistedApplication: scholarship.allowsAssistedApplication || false,
            assistedApplicationFee: scholarship.assistedApplicationFee !== null ? String(scholarship.assistedApplicationFee) : "",
            sponsored: true,
            sponsorName: "My Sponsor",
        };

        const payload = {
            ...formData,
            gpaRequirement: formData.gpaRequirement ? parseFloat(formData.gpaRequirement) : null,
            assistedApplicationFee: formData.assistedApplicationFee ? parseFloat(formData.assistedApplicationFee) : null,
            deadline: formData.deadline ? formData.deadline : null,
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

        console.log('PUT Response status:', putRes.status);
        console.log('PUT Response sponsored:', putData.sponsored);
        if (putRes.status !== 200) {
            console.log('Error payload:', putData);
        }

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
testFrontendPayload();
