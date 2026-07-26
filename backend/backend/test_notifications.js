const http = require('http');

const options = {
  hostname: 'localhost',
  port: 8080,
  headers: {
    'Content-Type': 'application/json'
  }
};

let token = '';

function request(method, path, data = null, useToken = true) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      ...options,
      method,
      path,
      headers: { ...options.headers }
    };
    if (useToken && token) {
      reqOptions.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: body ? JSON.parse(body) : {} });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function run() {
  console.log('1. Logging in as test user...');
  const loginRes = await request('POST', '/api/v1/auth/login', {
    email: 'abdulsobur1921@gmail.com',
    password: 'admin123'
  }, false);
  
  if (loginRes.status !== 200) {
    console.log('Login failed', loginRes.body);
    return;
  }
  token = loginRes.body.accessToken;
  console.log('Token acquired:', !!token);

  console.log('\n--- Fetching Notifications ---');
  let notifsRes = await request('GET', '/api/v1/notifications?page=0&size=5');
  console.log(`Status: ${notifsRes.status}`);
  console.log(JSON.stringify(notifsRes.body, null, 2));

  console.log('\n--- Fetching Unread Count ---');
  let countRes = await request('GET', '/api/v1/notifications/unread-count');
  console.log(`Status: ${countRes.status}`);
  console.log(countRes.body);

  if (notifsRes.body.content && notifsRes.body.content.length > 0) {
    const firstNotifId = notifsRes.body.content[0].id;
    console.log(`\n--- Marking notification ${firstNotifId} as read ---`);
    const markReadRes = await request('PATCH', `/api/v1/notifications/${firstNotifId}/read`);
    console.log(`Status: ${markReadRes.status}`);
    console.log(markReadRes.body);
    
    console.log(`\n--- Fetching notification ${firstNotifId} to verify isRead=true ---`);
    let updatedNotifsRes = await request('GET', '/api/v1/notifications?page=0&size=5');
    const updatedNotif = updatedNotifsRes.body.content.find(n => n.id === firstNotifId);
    console.log(updatedNotif);
  }

  console.log('\n--- Script complete (did not mark all as read to preserve for physical test) ---');
}

run().catch(console.error);
