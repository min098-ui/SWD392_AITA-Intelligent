import { pool } from '../config/db';

export async function seedPeExam() {
  console.log('🚀 [Seed PE Exam] Purging PRO192 course and PE exam as requested...');

  try {
    await pool.query(`
      DELETE FROM rubric_rules WHERE assignment_id IN (SELECT assignment_id FROM assignments WHERE course_id IN (SELECT course_id FROM courses WHERE course_code = 'PRO192') OR assignment_id = 70);
      DELETE FROM grading_results WHERE submission_id IN (SELECT submission_id FROM submissions WHERE assignment_id IN (SELECT assignment_id FROM assignments WHERE course_id IN (SELECT course_id FROM courses WHERE course_code = 'PRO192') OR assignment_id = 70));
      DELETE FROM submissions WHERE assignment_id IN (SELECT assignment_id FROM assignments WHERE course_id IN (SELECT course_id FROM courses WHERE course_code = 'PRO192') OR assignment_id = 70);
      DELETE FROM assignments WHERE course_id IN (SELECT course_id FROM courses WHERE course_code = 'PRO192') OR assignment_id = 70;
      DELETE FROM course_enrollments WHERE course_id IN (SELECT course_id FROM courses WHERE course_code = 'PRO192');
      DELETE FROM courses WHERE course_code = 'PRO192';
    `);
    console.log('✅ [Seed PE Exam] Successfully purged PRO192.');
  } catch (error: any) {
    console.warn('⚠️ [Seed PE Exam] Notice during PRO192 cleanup:', error.message);
  }
}

if (require.main === module) {
  seedPeExam().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
