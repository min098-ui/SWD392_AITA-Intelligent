import { pool } from '../config/db';

async function main() {
  const admins = [
    { email: 'lenguyenanhmai05@gmail.com', name: 'AMai Administrator' },
    { email: 'tuongvy22102004@gmail.com', name: 'Tuong Vy Administrator' },
    { email: 'admin@fpt.edu.vn', name: 'System Administrator' },
    { email: 'tajjjlojjj4444@gmail.com', name: 'Tai Administrator' },
  ];

  const defaultPasswordHash = '$2a$10$fUyXvogZImWkD34ItWppmenaSNAgzilb7Ml7ZQ5DCx0OvRo3.RfX2';

  for (const admin of admins) {
    const res = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, status)
       VALUES ($1, $2, $3, 'ADMIN', 'ACTIVE')
       ON CONFLICT (email) DO UPDATE SET role = 'ADMIN', status = 'ACTIVE'
       RETURNING user_id, full_name, email, role, status`,
      [admin.name, admin.email.toLowerCase(), defaultPasswordHash]
    );
    console.log('Admin account synced:', res.rows[0]);
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
