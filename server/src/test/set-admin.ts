import { pool } from '../config/db';

async function main() {
  const adminEmails = [
    'lenguyenanhmai05@gmail.com',
    'tuongvy22102004@gmail.com',
    'admin@fpt.edu.vn'
  ];
  const res = await pool.query(
    "UPDATE users SET role = 'ADMIN', status = 'ACTIVE' WHERE LOWER(email) = ANY($1::text[]) RETURNING user_id, full_name, email, role, status",
    [adminEmails.map(e => e.toLowerCase())]
  );
  console.log('Admin accounts updated successfully:', res.rows);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
