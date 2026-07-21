const fs = require('fs');

async function seed() {
  try {
    console.log("Logging in as admin...");
    const loginRes = await fetch('http://localhost:8080/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bakulisobur@gmail.com', password: 'admin123' })
    });
    
    if (!loginRes.ok) {
      throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
    }
    const loginData = await loginRes.json();
    const token = loginData.accessToken;
    console.log("Login successful. Seeding 10 scholarships...");

    const today = new Date();
    
    // Future dates
    const datePlus30 = new Date(today); datePlus30.setDate(today.getDate() + 30);
    const datePlus60 = new Date(today); datePlus60.setDate(today.getDate() + 60);
    const datePlus90 = new Date(today); datePlus90.setDate(today.getDate() + 90);
    
    // Past date
    const dateMinus10 = new Date(today); dateMinus10.setDate(today.getDate() - 10);
    
    // Closing soon (within 2 days)
    const datePlus1 = new Date(today); datePlus1.setDate(today.getDate() + 1);

    const formatDate = (date) => date.toISOString().split('T')[0];

    const scholarships = [
      {
        name: "KGSP Korean Government Scholarship",
        provider: "NIIED, South Korea",
        category: "UNDERGRADUATE_INTERNATIONAL",
        destinationCountry: "South Korea",
        eligibleFields: "Engineering, Sciences, Arts",
        gpaRequirement: 3.2,
        fundingCoverage: "Full tuition, monthly stipend, flights",
        deadline: formatDate(datePlus30),
        officialLink: "https://www.studyinkorea.go.kr",
        requirements: "Must be under 25 years of age. Good health.",
        selectionCriteria: "Academic excellence, interview.",
        additionalNotes: "Korean language training for 1 year required.",
        imageUrl: "https://picsum.photos/seed/kgsp-korea/800/450",
        status: "OPEN"
      },
      {
        name: "DAAD EPOS Scholarship",
        provider: "DAAD Germany",
        category: "POSTGRADUATE_INTERNATIONAL",
        destinationCountry: "Germany",
        eligibleFields: "Development Studies, Public Health",
        gpaRequirement: 3.0,
        fundingCoverage: "Monthly stipend of 861 EUR, health insurance",
        deadline: formatDate(datePlus60),
        officialLink: "https://www.daad.de",
        requirements: "2 years of professional experience.",
        selectionCriteria: "Relevance of motivation letter.",
        additionalNotes: "German language not mandatory but preferred.",
        imageUrl: "https://picsum.photos/seed/daad-germany/800/450",
        status: "OPEN"
      },
      {
        name: "Chevening UK Scholarship",
        provider: "UK Government",
        category: "POSTGRADUATE_INTERNATIONAL",
        destinationCountry: "UK",
        eligibleFields: "All Fields",
        gpaRequirement: 3.5,
        fundingCoverage: "Full tuition, monthly living allowance",
        deadline: formatDate(dateMinus10),
        officialLink: "https://www.chevening.org",
        requirements: "Return to home country for 2 years after study.",
        selectionCriteria: "Leadership potential, networking skills.",
        additionalNotes: "Highly competitive.",
        imageUrl: "https://picsum.photos/seed/chevening-uk/800/450",
        status: "CLOSED"
      },
      {
        name: "Mastercard Foundation Scholars Program",
        provider: "Mastercard Foundation",
        category: "UNDERGRADUATE_INTERNATIONAL",
        destinationCountry: "Canada",
        eligibleFields: "Agriculture, Business, Technology",
        gpaRequirement: 3.8,
        fundingCoverage: "Full funding including flights and accommodation",
        deadline: formatDate(datePlus1),
        officialLink: "https://mastercardfdn.org",
        requirements: "Demonstrated academic talent, economically disadvantaged.",
        selectionCriteria: "Commitment to giving back to the community.",
        additionalNotes: "Specific partner universities only.",
        imageUrl: "https://picsum.photos/seed/mcf-canada/800/450",
        status: "CLOSING_SOON"
      },
      {
        name: "Fulbright Foreign Student Program",
        provider: "US Department of State",
        category: "POSTGRADUATE_INTERNATIONAL",
        destinationCountry: "USA",
        eligibleFields: "All Fields (excluding clinical medicine)",
        gpaRequirement: 3.6,
        fundingCoverage: "Tuition, airfare, living stipend",
        deadline: formatDate(datePlus90),
        officialLink: "https://foreign.fulbrightonline.org",
        requirements: "English proficiency, J-1 visa compliance.",
        selectionCriteria: "Academic excellence, cultural exchange potential.",
        additionalNotes: "GRE/TOEFL required.",
        imageUrl: "https://picsum.photos/seed/fulbright-usa/800/450",
        status: "OPEN"
      },
      {
        name: "MEXT Japanese Government Scholarship",
        provider: "Ministry of Education, Japan",
        category: "POSTGRADUATE_INTERNATIONAL",
        destinationCountry: "Japan",
        eligibleFields: "Science, Technology, Engineering",
        gpaRequirement: 3.0,
        fundingCoverage: "Full tuition, monthly allowance of 143,000 JPY",
        deadline: formatDate(datePlus60),
        officialLink: "https://www.mext.go.jp",
        requirements: "Must be willing to learn Japanese.",
        selectionCriteria: "Written exams in English and Japanese, interview.",
        additionalNotes: "Research plan is critical.",
        imageUrl: "https://picsum.photos/seed/mext-japan/800/450",
        status: "OPEN"
      },
      {
        name: "Swiss Government Excellence Scholarships",
        provider: "FCS, Switzerland",
        category: "POSTGRADUATE_INTERNATIONAL",
        destinationCountry: "Switzerland",
        eligibleFields: "All Fields",
        gpaRequirement: 3.5,
        fundingCoverage: "Monthly payment of 1,920 CHF",
        deadline: formatDate(datePlus1),
        officialLink: "https://www.sbfi.admin.ch",
        requirements: "Master's degree, letter of support from host professor.",
        selectionCriteria: "Academic profile, research project quality.",
        additionalNotes: "No tuition fee coverage (tuition is usually low).",
        imageUrl: "https://picsum.photos/seed/swiss-fcs/800/450",
        status: "CLOSING_SOON"
      },
      {
        name: "Eiffel Excellence Scholarship",
        provider: "French Ministry for Europe",
        category: "POSTGRADUATE_INTERNATIONAL",
        destinationCountry: "France",
        eligibleFields: "Engineering, Management, Law",
        gpaRequirement: 3.4,
        fundingCoverage: "Monthly allowance of 1,181 EUR",
        deadline: formatDate(dateMinus10),
        officialLink: "https://www.campusfrance.org",
        requirements: "Application must be submitted by the French institution.",
        selectionCriteria: "Excellence of the candidate and the institution.",
        additionalNotes: "Does not cover tuition fees.",
        imageUrl: "https://picsum.photos/seed/eiffel-france/800/450",
        status: "CLOSED"
      },
      {
        name: "Australia Awards Scholarships",
        provider: "Australian Government",
        category: "POSTGRADUATE_INTERNATIONAL",
        destinationCountry: "Australia",
        eligibleFields: "Public Policy, Health, Environment",
        gpaRequirement: 3.2,
        fundingCoverage: "Full tuition, return air travel, establishment allowance",
        deadline: formatDate(datePlus30),
        officialLink: "https://www.dfat.gov.au",
        requirements: "Must return to home country for 2 years.",
        selectionCriteria: "Professional and personal qualities, academic competence.",
        additionalNotes: "Focuses on development impact.",
        imageUrl: "https://picsum.photos/seed/australia-awards/800/450",
        status: "OPEN"
      },
      {
        name: "Gates Cambridge Scholarship",
        provider: "Gates Cambridge Trust",
        category: "POSTGRADUATE_INTERNATIONAL",
        destinationCountry: "UK",
        eligibleFields: "All Fields",
        gpaRequirement: 3.9,
        fundingCoverage: "University composition fee, maintenance allowance",
        deadline: formatDate(datePlus60),
        officialLink: "https://www.gatescambridge.org",
        requirements: "Admitted to Cambridge University.",
        selectionCriteria: "Outstanding intellectual ability, leadership potential.",
        additionalNotes: "Extremely competitive.",
        imageUrl: "https://picsum.photos/seed/gates-cambridge/800/450",
        status: "FULL"
      }
    ];

    const results = [];
    for (const sch of scholarships) {
      console.log(`Creating: ${sch.name}...`);
      const res = await fetch('http://localhost:8080/api/v1/scholarships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(sch)
      });
      if (!res.ok) {
         console.error(`Failed to create ${sch.name}: ${res.status} ${await res.text()}`);
      } else {
         const data = await res.json();
         // Now verify it by publishing it
         const verifyRes = await fetch(`http://localhost:8080/api/v1/scholarships/${data.id}/verify`, {
           method: 'PUT',
           headers: {
             'Authorization': `Bearer ${token}`
           }
         });
         if (!verifyRes.ok) {
           console.error(`Failed to verify ${sch.name}: ${verifyRes.status} ${await verifyRes.text()}`);
         }
         results.push(data);
         console.log(`Success: ID ${data.id}`);
      }
    }

    console.log("\n--- Verification Table ---");
    console.table(results.map(r => ({ Title: r.name, Status: r.status, Deadline: r.deadline })));

  } catch (err) {
    console.error(err);
  }
}

seed();
