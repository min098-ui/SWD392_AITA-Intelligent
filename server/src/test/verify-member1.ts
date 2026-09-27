import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { authenticateJWT, requireRole } from '../common/auth.middleware';

/**
 * Automated Verification Test Suite for Member 1:
 * Software Architect & Core Auth Engineer
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

async function runTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING MEMBER 1 VERIFICATION TEST SUITE');
  console.log('================================================================\n');

  // ---------------------------------------------------------------------------
  // TEST GROUP 1: Bcrypt Hashing (BR-01: salt = 10) & Password Verification
  // ---------------------------------------------------------------------------
  console.log('--- Test Group 1: Bcrypt Hashing & Password Verification (BR-01) ---');
  const password = 'Password@123';
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);

  assert(hash.startsWith('$2a$10$') || hash.startsWith('$2b$10$'), 'Hash adheres to Bcrypt salt = 10 prefix');
  const isValid = await bcrypt.compare(password, hash);
  assert(isValid === true, 'Bcrypt compare matches original password');

  const isInvalid = await bcrypt.compare('WrongPassword', hash);
  assert(isInvalid === false, 'Bcrypt compare rejects incorrect password');

  // Test the seed hash stored in seed.sql
  const seedHash = '$2a$10$fUyXvogZImWkD34ItWppmenaSNAgzilb7Ml7ZQ5DCx0OvRo3.RfX2';
  const isSeedValid = await bcrypt.compare(password, seedHash);
  assert(isSeedValid === true, 'Seed.sql hash successfully validates Password@123');

  // ---------------------------------------------------------------------------
  // TEST GROUP 2: JWT Access Token Generation & Payload Structure
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Group 2: JWT Access Token Payload Structure ---');
  const secret = 'super_secret_jwt_key_aita_project_swd392_2026';
  const payload = {
    userId: 2,
    email: 'giangnv@fe.edu.vn',
    role: 'LECTURER' as const,
    fullName: 'Dr. Nguyen Van Giang',
  };

  const token = jwt.sign(payload, secret, { expiresIn: '7d' });
  assert(typeof token === 'string' && token.length > 20, 'JWT token generated successfully');

  const decoded = jwt.verify(token, secret) as any;
  assert(decoded.userId === 2, 'JWT payload contains correct userId');
  assert(decoded.role === 'LECTURER', 'JWT payload contains correct role');
  assert(decoded.email === 'giangnv@fe.edu.vn', 'JWT payload contains correct email');

  // ---------------------------------------------------------------------------
  // TEST GROUP 3: Middleware authenticateJWT & requireRole RBAC
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Group 3: Middleware authenticateJWT & RBAC (3 Roles) ---');

  // Case 3.1: Missing token -> 401
  let statusResult = 0;
  let jsonResult: any = null;
  const mockReqNoToken: any = { headers: {} };
  const mockRes: any = {
    status: (code: number) => {
      statusResult = code;
      return { json: (data: any) => { jsonResult = data; } };
    },
    json: (data: any) => { jsonResult = data; },
  };

  const tracker: any = { nextCalled: false };
  authenticateJWT(mockReqNoToken, mockRes, () => { tracker.nextCalled = true; });
  assert(statusResult === 401 && !tracker.nextCalled, 'authenticateJWT returns 401 when Authorization header is missing');

  // Case 3.2: Valid token -> attaches req.user and calls next()
  statusResult = 0;
  tracker.nextCalled = false;
  const mockReqValidToken: any = {
    headers: { authorization: `Bearer ${token}` },
  };
  authenticateJWT(mockReqValidToken, mockRes, () => { tracker.nextCalled = true; });
  assert(Boolean(tracker.nextCalled) === true, 'authenticateJWT calls next() for valid Bearer token');
  assert(mockReqValidToken.user?.userId === 2, 'authenticateJWT successfully attaches req.user');
  assert(mockReqValidToken.user?.role === 'LECTURER', 'authenticateJWT preserves user role in req.user');

  // Case 3.3: Invalid token -> 403
  statusResult = 0;
  tracker.nextCalled = false;
  const mockReqBadToken: any = {
    headers: { authorization: 'Bearer invalid.token.value' },
  };
  authenticateJWT(mockReqBadToken, mockRes, () => { tracker.nextCalled = true; });
  assert(statusResult === 403 && !tracker.nextCalled, 'authenticateJWT returns 403 for invalid token');

  // Case 3.4: RBAC requireRole check - Allowed role
  tracker.nextCalled = false;
  const requireLecturer = requireRole('LECTURER', 'ADMIN');
  requireLecturer(mockReqValidToken, mockRes, () => { tracker.nextCalled = true; });
  assert(Boolean(tracker.nextCalled) === true, 'requireRole allows LECTURER for [LECTURER, ADMIN]');

  // Case 3.5: RBAC requireRole check - Forbidden role
  statusResult = 0;
  tracker.nextCalled = false;
  const requireAdminOnly = requireRole('ADMIN');
  requireAdminOnly(mockReqValidToken, mockRes, () => { tracker.nextCalled = true; });
  assert(statusResult === 403 && !tracker.nextCalled, 'requireRole denies LECTURER for [ADMIN] with 403 Forbidden');



  // ---------------------------------------------------------------------------
  // TEST GROUP 4: Database Schema & Seed Consistency Check
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Group 4: Schema & Seed File Integrity ---');
  const fs = require('fs');
  const path = require('path');

  const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
  const seedPath = path.resolve(__dirname, '../../../database/seed.sql');

  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  const seedContent = fs.readFileSync(seedPath, 'utf-8');

  // Schema checks
  assert(schemaContent.includes('CREATE TABLE IF NOT EXISTS users'), 'schema.sql defines users table');
  assert(schemaContent.includes('CREATE TABLE IF NOT EXISTS courses'), 'schema.sql defines courses table');
  assert(schemaContent.includes('CREATE TABLE IF NOT EXISTS teams'), 'schema.sql defines teams table');
  assert(schemaContent.includes('CREATE TABLE IF NOT EXISTS team_members'), 'schema.sql defines team_members table');
  assert(schemaContent.includes('uq_team_user UNIQUE (team_id, user_id)'), 'schema.sql defines unique constraint on team_members');
  assert(schemaContent.includes('idx_courses_lecturer'), 'schema.sql contains index on courses(lecturer_id)');
  assert(schemaContent.includes('idx_teams_course'), 'schema.sql contains index on teams(course_id)');

  // Seed checks
  assert(seedContent.includes('admin@fpt.edu.vn'), 'seed.sql contains Admin user');
  assert(seedContent.includes('giangnv@fe.edu.vn'), 'seed.sql contains Lecturer user');
  assert(seedContent.includes('student1@fpt.edu.vn'), 'seed.sql contains Student 1');
  assert(seedContent.includes('student2@fpt.edu.vn'), 'seed.sql contains Student 2');
  assert(seedContent.includes('student3@fpt.edu.vn'), 'seed.sql contains Student 3');
  assert(seedContent.includes('SWD392'), 'seed.sql contains SWD392 course');
  assert(seedContent.includes('Group 4 - AITA Project'), 'seed.sql contains Group 4 team');

  // ---------------------------------------------------------------------------
  // TEST GROUP 5: Express Routes Registration Check
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Group 5: Express App Endpoints & Route Mounting ---');
  const app = require('../index').default;
  const routerStack = app._router?.stack || [];

  const registeredRoutes = routerStack
    .filter((layer: any) => layer.name === 'router')
    .map((layer: any) => layer.regexp.toString());

  const hasAuthRoute = registeredRoutes.some((r: string) => r.includes('auth'));
  const hasCoursesRoute = registeredRoutes.some((r: string) => r.includes('courses'));
  const hasTeamsRoute = registeredRoutes.some((r: string) => r.includes('teams'));

  assert(hasAuthRoute, 'Express app mounts /api/auth route');
  assert(hasCoursesRoute, 'Express app mounts /api/courses route');
  assert(hasTeamsRoute, 'Express app mounts /api/teams route');

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`🏁 TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
