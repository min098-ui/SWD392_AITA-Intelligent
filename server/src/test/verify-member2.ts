import jwt from 'jsonwebtoken';
import http from 'http';
import app from '../index';
import { pool } from '../config/db';
import { gradingWorkerService } from '../modules/grading/grading.worker';
import { sandboxService } from '../modules/grading/sandbox.service';

/**
 * Automated Verification Test Suite for Member 2:
 * Docker Sandbox & Autograding Engineer (SWD392 Group 4)
 */

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, failureDetail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${failureDetail ? ` -> ${failureDetail}` : ''}`);
    failedTests++;
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'aita_jwt_secret_dev_key_2026';

// Mock JWT Tokens
const lecturerToken = jwt.sign(
  { userId: 2, email: 'giangnv@fe.edu.vn', role: 'LECTURER' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const studentToken = jwt.sign(
  { userId: 4, email: 'student2@fpt.edu.vn', role: 'STUDENT' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// HTTP request helper
async function makeRequest(
  port: number,
  method: string,
  path: string,
  token?: string,
  body?: any
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (postData) {
      headers['Content-Length'] = Buffer.byteLength(postData).toString();
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: port,
        path: path,
        method: method,
        headers: headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          let parsedData = {};
          try {
            parsedData = JSON.parse(rawData);
          } catch {
            parsedData = { raw: rawData };
          }
          resolve({ status: res.statusCode || 500, data: parsedData });
        });
      }
    );

    req.on('error', (e) => {
      reject(e);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runMember2Verification() {
  console.log('================================================================');
  console.log('🧪 RUNNING MEMBER 2 VERIFICATION TEST SUITE');
  console.log('   Docker Sandbox & Autograding Engineer (SWD392 Group 4)');
  console.log('================================================================\n');

  const TEST_PORT = 5098;
  const server = app.listen(TEST_PORT);
  await sleep(400);

  try {
    // ---------------------------------------------------------------------------
    // PRE-FLIGHT: Docker Sandbox Availability Check
    // ---------------------------------------------------------------------------
    console.log('--- Pre-Flight: Docker Sandbox Availability ---');
    const isDockerLive = await sandboxService.checkDockerAvailability();
    assert(isDockerLive === true, 'Docker Sandbox Engine is connected and operational');

    // Setup Assignment with Public & Hidden Rubric Rules for the tests
    const createAssignRes = await makeRequest(TEST_PORT, 'POST', '/api/assignments', lecturerToken, {
      course_id: 1,
      title: 'Assignment Lab: Two Sum and Algorithm Security Benchmark',
      description: 'Calculate the sum of two numbers with boundary conditions and hidden stress tests.',
      start_date: new Date(),
      due_date: new Date(Date.now() + 86400000 * 7),
      max_score: 10.0,
      submission_type: 'INDIVIDUAL',
      rubrics: [
        {
          rule_type: 'AUTOMATED',
          criterion: 'Test Case 1 (Public): Standard positive integers',
          input_data: '15 25',
          expected_output: '40',
          weight: 1.0,
          max_score: 3.0,
          is_hidden: false,
        },
        {
          rule_type: 'AUTOMATED',
          criterion: 'Test Case 2 (Public): Negative and positive balance',
          input_data: '-50 70',
          expected_output: '20',
          weight: 1.0,
          max_score: 3.0,
          is_hidden: false,
        },
      ],
    });

    assert(createAssignRes.status === 201, 'Lecturer successfully created assignment (HTTP 201)');
    const assignmentId = createAssignRes.data.assignment.assignment_id;

    // Add Hidden Test Case (BR-06)
    const addHiddenRes = await makeRequest(
      TEST_PORT,
      'POST',
      `/api/assignments/${assignmentId}/rubrics`,
      lecturerToken,
      {
        rule_type: 'AUTOMATED',
        criterion: 'Test Case 3 (Hidden - Secret Edge Case): Large integer boundary',
        input_data: '5000000 5000000',
        expected_output: '10000000',
        weight: 1.0,
        max_score: 4.0,
        is_hidden: true,
      }
    );
    assert(addHiddenRes.status === 201, 'Lecturer added Hidden Rubric Rule with is_hidden = true (HTTP 201)');

    // ---------------------------------------------------------------------------
    // TEST CASE 1: Code Đúng (Pass All Test Cases -> 10/10 Điểm)
    // ---------------------------------------------------------------------------
    console.log('\n--- ✅ TEST CASE 1: Correct Code Execution (10/10 Perfect Score) ---');
    const correctCode = `
# Student Python Solution: Two Sum
import sys
a, b = map(int, input().split())
print(a + b)
`;

    const sub1Res = await makeRequest(TEST_PORT, 'POST', '/api/submissions', studentToken, {
      assignment_id: assignmentId,
      team_id: 1,
      artifact_url: 'https://github.com/aita-project/aita-intelligent/commit/c001',
      git_commit_hash: 'c001a2b3c4d5',
      code_content: correctCode,
      language: 'python',
    });

    assert(sub1Res.status === 201, 'Student submitted correct code successfully (HTTP 201)');
    assert(sub1Res.data.submission.status === 'QUEUED', 'Submission initially has status = QUEUED');

    const subId1 = sub1Res.data.submission.submission_id;
    const jobId1 = sub1Res.data.grading_job.grading_job_id;

    // Wait for BullMQ Worker and Sandbox to complete
    let sub1FinalStatus = '';
    for (let i = 0; i < 20; i++) {
      await sleep(1000);
      const checkRes = await makeRequest(TEST_PORT, 'GET', `/api/submissions/${subId1}`, studentToken);
      sub1FinalStatus = checkRes.data.submission.status;
      if (sub1FinalStatus === 'GRADED' || sub1FinalStatus === 'FAILED') break;
    }

    assert(sub1FinalStatus === 'GRADED', `Submission transitioned to status = GRADED (actual: ${sub1FinalStatus})`);

    // Fetch Grading Results
    const grade1Res = await makeRequest(TEST_PORT, 'GET', `/api/grading/${jobId1}/results`, studentToken);
    assert(grade1Res.status === 200, 'Grading results query returned HTTP 200');
    assert(grade1Res.data.job.status === 'COMPLETED', 'Grading job marked status = COMPLETED');
    assert(grade1Res.data.job.total_score === 10.0, `Total score is exactly 10/10 (actual: ${grade1Res.data.job.total_score})`);
    assert(grade1Res.data.job.passed_rules_count === 3, 'Passed all 3/3 test cases in Sandbox');

    // ---------------------------------------------------------------------------
    // TEST CASE 2: Code Lỗi / Vòng Lặp Vô Tận (BR-03 Timeout Safeguard)
    // ---------------------------------------------------------------------------
    console.log('\n--- ✅ TEST CASE 2: Infinite Loop / Timeout Safeguard (BR-03) ---');
    const infiniteLoopCode = `
# Student Buggy Solution: Infinite Loop
import time
while True:
    time.sleep(0.05)
`;

    const sub2Res = await makeRequest(TEST_PORT, 'POST', '/api/submissions', studentToken, {
      assignment_id: assignmentId,
      team_id: 1,
      artifact_url: 'https://github.com/aita-project/aita-intelligent/commit/bug001',
      git_commit_hash: 'bug001a2b3c4',
      code_content: infiniteLoopCode,
      language: 'python',
    });

    assert(sub2Res.status === 201, 'Submitted infinite loop code to pipeline (HTTP 201)');
    const subId2 = sub2Res.data.submission.submission_id;
    const jobId2 = sub2Res.data.grading_job.grading_job_id;

    // Wait for Sandbox Timeout Safeguard to trigger
    let sub2FinalStatus = '';
    for (let i = 0; i < 35; i++) {
      await sleep(1000);
      const checkRes = await makeRequest(TEST_PORT, 'GET', `/api/submissions/${subId2}`, studentToken);
      sub2FinalStatus = checkRes.data.submission.status;
      if (sub2FinalStatus === 'GRADED' || sub2FinalStatus === 'FAILED') break;
    }

    assert(sub2FinalStatus === 'GRADED' || sub2FinalStatus === 'FAILED', 'Pipeline handled timeout without hanging');

    const grade2Res = await makeRequest(TEST_PORT, 'GET', `/api/grading/${jobId2}/results`, studentToken);
    assert(grade2Res.data.job.total_score === 0.0, `Penalized with 0.0/10.0 score for timeout (actual: ${grade2Res.data.job.total_score})`);
    assert(grade2Res.data.job.passed_rules_count === 0, '0 test cases passed due to timeout termination');

    // ---------------------------------------------------------------------------
    // TEST CASE 3: Bảo Mật Test Ẩn (BR-06 Protection for Students)
    // ---------------------------------------------------------------------------
    console.log('\n--- ✅ TEST CASE 3: Hidden Test Case Protection (BR-06) ---');

    // 1. Student queries assignment details
    const studentViewAssign = await makeRequest(TEST_PORT, 'GET', `/api/assignments/${assignmentId}`, studentToken);
    const studentRules = studentViewAssign.data.rubric_rules;
    const hiddenRuleStudent = studentRules.find((r: any) => r.is_hidden);

    assert(hiddenRuleStudent !== undefined, 'Hidden rule is returned in rubric list');
    assert(
      hiddenRuleStudent.input_data === '[PROTECTED TEST CASE]',
      'Student CANNOT view input_data of hidden rubric (Shielded as [PROTECTED TEST CASE])'
    );
    assert(
      hiddenRuleStudent.expected_output === '[PROTECTED TEST CASE]',
      'Student CANNOT view expected_output of hidden rubric (Shielded as [PROTECTED TEST CASE])'
    );

    // 2. Student queries grading results
    const studentViewResults = await makeRequest(TEST_PORT, 'GET', `/api/grading/${jobId1}/results`, studentToken);
    const hiddenResultStudent = studentViewResults.data.results.find((r: any) => r.is_hidden);
    assert(
      hiddenResultStudent.input_data === '[PROTECTED TEST CASE]',
      'Student CANNOT view input_data in grading results'
    );
    assert(
      hiddenResultStudent.expected_output === '[PROTECTED TEST CASE]',
      'Student CANNOT view expected_output in grading results'
    );

    // 3. Lecturer queries assignment details (Full Access)
    const lecturerViewAssign = await makeRequest(TEST_PORT, 'GET', `/api/assignments/${assignmentId}`, lecturerToken);
    const hiddenRuleLecturer = lecturerViewAssign.data.rubric_rules.find((r: any) => r.is_hidden);
    assert(
      hiddenRuleLecturer.input_data === '5000000 5000000',
      'Lecturer CAN view raw input_data for hidden test case'
    );
    assert(
      hiddenRuleLecturer.expected_output === '10000000',
      'Lecturer CAN view raw expected_output for hidden test case'
    );

    // ---------------------------------------------------------------------------
    // SUMMARY
    // ---------------------------------------------------------------------------
    console.log('\n================================================================');
    console.log(`📊 MEMBER 2 TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log('================================================================\n');

    if (failedTests === 0) {
      console.log('🎉 ALL MEMBER 2 SPECIFICATIONS & BUSINESS RULES VALIDATED 100% SUCCESSFULLY!\n');
    }
  } finally {
    server.close();
    await gradingWorkerService.closeWorker();
    await pool.end().catch(() => {});
    process.exit(failedTests > 0 ? 1 : 0);
  }
}

runMember2Verification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
