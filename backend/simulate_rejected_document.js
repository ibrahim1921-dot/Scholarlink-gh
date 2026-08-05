const { Client } = require('pg');

async function simulateRejectedDocument() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'scholarlink',
    password: 'root', // Assumed from previous sessions/env
    port: 5432,
  });

  try {
    await client.connect();

    // Find a student
    const studentRes = await client.query(`SELECT id, email FROM users WHERE role = 'STUDENT' LIMIT 1`);
    if (studentRes.rows.length === 0) {
      console.log('No student found.');
      return;
    }
    const student = studentRes.rows[0];

    // Insert a REJECTED document with admin_reviewed = false
    const query = `
      INSERT INTO document_upload (
        student_id, document_type, filename, mime_type, storage_path, 
        verification_status, verification_notes, admin_reviewed, uploaded_at, updated_at
      ) VALUES (
        $1, 'TRANSCRIPT', 'fake_rejected_doc.pdf', 'application/pdf', 'mock_path', 
        'REJECTED', 'AI detected forgery.', false, NOW(), NOW()
      ) RETURNING id
    `;
    const res = await client.query(query, [student.id]);
    
    console.log(`Success! Created REJECTED document for ${student.email} with ID ${res.rows[0].id}`);
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

simulateRejectedDocument();
