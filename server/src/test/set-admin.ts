import { pool } from '../config/db';

async function main() {
  const email = 'lenguyenanhmai05@gmail.com';
  const res = await pool.query(
    "UPDATE users SET role = 'ADMIN' WHERE LOWER(email) = LOWER($1) RETURNING user_id, full_name, email, role",
    [email]
  );
  console.log('Result:', res.rows);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
