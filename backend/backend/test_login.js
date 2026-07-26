const fetch = require('node-fetch');
fetch('http://localhost:8080/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'abdulsobur1921@gmail.com', password: 'Password123!' })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));
