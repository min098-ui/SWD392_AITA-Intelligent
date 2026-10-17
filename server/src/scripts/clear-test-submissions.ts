import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const connectionString =
  process.env.DATABASE_URL || 'postgresql://aita_user:aita_password_123@localhost:5432/aita_db';

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 5000,
});

async function clearTestSubmissions() {
  const client = await pool.connect();
  try {
    console.log('🧹 Clearing test submissions and grading jobs...');
    
    // 1. Delete grading results
    const r1 = await client.query('DELETE FROM grading_results');
    console.log(`   - Deleted ${r1.rowCount} records from grading_results`);

    // 2. Delete grading jobs
    const r2 = await client.query('DELETE FROM grading_jobs');
    console.log(`   - Deleted ${r2.rowCount} records from grading_jobs`);

    // 3. Delete submissions
    const r3 = await client.query('DELETE FROM submissions');
    console.log(`   - Deleted ${r3.rowCount} records from submissions`);

    // 4. Delete test rubric rules
    const r4 = await client.query(
      `DELETE FROM rubric_rules WHERE assignment_id IN (
         SELECT assignment_id FROM assignments WHERE title ILIKE '%Benchmark%' OR title ILIKE '%Test%'
       )`
    );
    console.log(`   - Deleted ${r4.rowCount} test rubric rules`);

    // 5. Delete test assignments created during automated testing
    const r5 = await client.query(
      `DELETE FROM assignments WHERE title ILIKE '%Benchmark%' OR title ILIKE '%Test%'`
    );
    console.log(`   - Deleted ${r5.rowCount} test assignments`);

    console.log('\n✅ All test submissions cleared successfully! Database is completely clean.');
  } catch (error) {
    console.error('❌ Error clearing test submissions:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

clearTestSubmissions();
