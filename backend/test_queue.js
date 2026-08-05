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

async function testQueue() {
  console.log('=== LOGGING IN ===');
  const loginRes = await request('POST', '/api/v1/auth/login', {
    email: 'bakulisobur@gmail.com',
    password: 'admin123'
  });
  const token = loginRes.data.accessToken;

  console.log('\n=== GET SUSPICIOUS DOCS ===');
  const docsRes = await request('GET', '/api/v1/documents/admin/suspicious', null, token);
  console.log('Status:', docsRes.status);
  console.log('Docs returned:', docsRes.data.length);
  const myDoc = docsRes.data.find(d => d.filename === 'fake_rejected_doc.pdf');
  console.log('Is our fake rejected doc in the queue?', !!myDoc);
  if (myDoc) {
     console.log(myDoc);
  }
}

testQueue().catch(console.error);
