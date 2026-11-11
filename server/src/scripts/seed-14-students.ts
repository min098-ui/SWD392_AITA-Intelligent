import { pool } from '../config/db';

const newStudents = [
  { full_name: 'Trần Bảo Nam', email: 'namtbqe180101@fpt.edu.vn' },
  { full_name: 'Hoàng Minh Quân', email: 'quanhmqe180102@fpt.edu.vn' },
  { full_name: 'Phan Thảo Vy', email: 'vyptqe180103@fpt.edu.vn' },
  { full_name: 'Vũ Đức Trọng', email: 'trongvdqe180104@fpt.edu.vn' },
  { full_name: 'Bùi Thu Trang', email: 'trangbtqe180105@fpt.edu.vn' },
  { full_name: 'Đặng Quang Huy', email: 'huydqqe180106@fpt.edu.vn' },
  { full_name: 'Trịnh Ngọc Hân', email: 'hantnqe180107@fpt.edu.vn' },
  { full_name: 'Dương Quốc Anh', email: 'anhdqqe180108@fpt.edu.vn' },
  { full_name: 'Ngô Diệu Linh', email: 'linhndqe180109@fpt.edu.vn' },
  { full_name: 'Phạm Tuấn Kiệt', email: 'kietptqe180110@fpt.edu.vn' },
  { full_name: 'Lâm Gia Hưng', email: 'hunglgqe180111@fpt.edu.vn' },
  { full_name: 'Mai Phương Thảo', email: 'thaompqe180112@fpt.edu.vn' },
  { full_name: 'Đỗ Hoàng Long', email: 'longdhqe180113@fpt.edu.vn' },
  { full_name: 'Huỳnh Thanh Trúc', email: 'truchttqe180114@fpt.edu.vn' },
];

const passHash = '$2a$10$fUyXvogZImWkD34ItWppmenaSNAgzilb7Ml7ZQ5DCx0OvRo3.RfX2';

async function seed() {
  console.log('Seeding 14 unassigned students into PostgreSQL...');
  let added = 0;
  for (const s of newStudents) {
    const res = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, status)
       VALUES ($1, $2, $3, 'STUDENT', 'ACTIVE')
       ON CONFLICT (email) DO NOTHING
       RETURNING user_id, full_name, email`,
      [s.full_name, s.email, passHash]
    );
    if (res.rows.length > 0) {
      added++;
      console.log(`+ Added: ${s.full_name} (${s.email})`);
    }
  }

  const countRes = await pool.query("SELECT COUNT(*)::int as count FROM users WHERE role = 'STUDENT'");
  console.log(`✅ Success! Added ${added} new students. Total STUDENT count in DB: ${countRes.rows[0].count}`);
  await pool.end();
}

seed().catch((err) => {
  console.error('❌ Error seeding students:', err);
  process.exit(1);
});

