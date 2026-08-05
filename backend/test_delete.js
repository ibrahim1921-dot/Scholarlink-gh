const http = require('http');

function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsed = body;
        try { parsed = JSON.parse(body); } catch (e) {}
        resolve({ status: res.statusCode, data: parsed });
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testDelete() {
  console.log('=== LOGGING IN ===');
  const loginRes = await request('POST', '/api/v1/auth/login', {
    email: 'bakulisobur@gmail.com',
    password: 'admin123'
  });
  const token = loginRes.data.accessToken;
  console.log('Admin token retrieved:', !!token);

  console.log('\n=== GET USERS ===');
  const usersRes = await request('GET', '/api/v1/admin/users', null, token);
  console.log('Status:', usersRes.status);
  
  if (usersRes.data && usersRes.data.content) {
    const student = usersRes.data.content.find(u => u.role === 'STUDENT' || u.id === 15);
    if (!student) {
      console.log('No student found to delete.');
      return;
    }
    
    console.log(`\n=== FORCE DELETE USER ${student.id} ===`);
    const delRes = await request('DELETE', `/api/v1/admin/users/${student.id}?force=true`, null, token);
    console.log('Status:', delRes.status);
    console.log('Response:', JSON.stringify(delRes.data, null, 2));

  }
}

testDelete().catch(console.error);
