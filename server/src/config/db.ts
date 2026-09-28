import { Pool } from 'pg';
import dotenv from 'dotenv';

import path from 'path';

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const realPool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://aita_user:aita_password_123@localhost:5432/aita_db',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

realPool.on('error', () => {
  // Silent idle error when PostgreSQL is not running locally
});

// In-memory mock store populated with seed data
interface MockUser {
  user_id: number;
  full_name: string;
  email: string;
  password_hash: string;
  role: 'ADMIN' | 'LECTURER' | 'STUDENT';
  created_at: Date;
}

interface MockCourse {
  course_id: number;
  course_code: string;
  course_name: string;
  semester: string;
  lecturer_id: number;
}

interface MockTeam {
  team_id: number;
  team_name: string;
  course_id: number;
  repo_url: string;
}

interface MockTeamMember {
  team_member_id: number;
  team_id: number;
  user_id: number;
  assigned_module: string;
}

const mockUsers: MockUser[] = [
  {
    user_id: 1,
    full_name: 'System Administrator',
    email: 'admin@fpt.edu.vn',
    password_hash: '$2a$10$fUyXvogZImWkD34ItWppmenaSNAgzilb7Ml7ZQ5DCx0OvRo3.RfX2',
    role: 'ADMIN',
    created_at: new Date(),
  },
  {
    user_id: 2,
    full_name: 'Dr. Nguyen Van Giang',
    email: 'giangnv@fe.edu.vn',
    password_hash: '$2a$10$fUyXvogZImWkD34ItWppmenaSNAgzilb7Ml7ZQ5DCx0OvRo3.RfX2',
    role: 'LECTURER',
    created_at: new Date(),
  },
  {
    user_id: 3,
    full_name: 'Sinh Viên 1 (Auth & Architecture)',
    email: 'student1@fpt.edu.vn',
    password_hash: '$2a$10$fUyXvogZImWkD34ItWppmenaSNAgzilb7Ml7ZQ5DCx0OvRo3.RfX2',
    role: 'STUDENT',
    created_at: new Date(),
  },
  {
    user_id: 4,
    full_name: 'Sinh Viên 2 (Docker Sandbox)',
    email: 'student2@fpt.edu.vn',
    password_hash: '$2a$10$fUyXvogZImWkD34ItWppmenaSNAgzilb7Ml7ZQ5DCx0OvRo3.RfX2',
    role: 'STUDENT',
    created_at: new Date(),
  },
  {
    user_id: 5,
    full_name: 'Sinh Viên 3 (AI Tutor & Prompts)',
    email: 'student3@fpt.edu.vn',
    password_hash: '$2a$10$fUyXvogZImWkD34ItWppmenaSNAgzilb7Ml7ZQ5DCx0OvRo3.RfX2',
    role: 'STUDENT',
    created_at: new Date(),
  },
];

const mockCourses: MockCourse[] = [
  {
    course_id: 1,
    course_code: 'SWD392',
    course_name: 'Software Architecture & Design Project',
    semester: 'FA26',
    lecturer_id: 2,
  },
];

const mockTeams: MockTeam[] = [
  {
    team_id: 1,
    team_name: 'Group 4 - AITA Project',
    course_id: 1,
    repo_url: 'https://github.com/aita-project/aita-intelligent.git',
  },
];

const mockTeamMembers: MockTeamMember[] = [
  {
    team_member_id: 1,
    team_id: 1,
    user_id: 3,
    assigned_module: 'Software Architecture, Auth & Course Core',
  },
  {
    team_member_id: 2,
    team_id: 1,
    user_id: 4,
    assigned_module: 'Docker Sandbox Runner & Async Grading Queue',
  },
  {
    team_member_id: 3,
    team_id: 1,
    user_id: 5,
    assigned_module: 'AI Engine, Socratic Tutor & Key Rotation',
  },
];

let isPostgresAvailable: boolean = true;

async function executeMockQuery(sqlText: string, params: any[] = []): Promise<{ rows: any[] }> {

  const cleanSql = sqlText.replace(/\s+/g, ' ').trim();

  // SELECT NOW()
  if (/SELECT NOW\(\)/i.test(cleanSql)) {
    return { rows: [{ now: new Date().toISOString() }] };
  }

  // Auth: SELECT user_id FROM users WHERE LOWER(email) = LOWER($1)
  if (/SELECT user_id FROM users WHERE LOWER\(email\) = LOWER\(\$1\)/i.test(cleanSql)) {
    const email = (params[0] || '').toLowerCase();
    const user = mockUsers.find((u) => u.email.toLowerCase() === email);
    return { rows: user ? [{ user_id: user.user_id }] : [] };
  }

  // Auth: INSERT INTO users ... RETURNING ...
  if (/INSERT INTO users/i.test(cleanSql)) {
    const [full_name, email, password_hash, role] = params;
    const existing = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      const err: any = new Error('duplicate key value violates unique constraint');
      err.code = '23505';
      throw err;
    }
    const newId = mockUsers.length > 0 ? Math.max(...mockUsers.map((u) => u.user_id)) + 1 : 1;
    const newUser: MockUser = {
      user_id: newId,
      full_name,
      email,
      password_hash,
      role,
      created_at: new Date(),
    };
    mockUsers.push(newUser);
    return { rows: [newUser] };
  }

  // Auth: SELECT * FROM users WHERE LOWER(email) = LOWER($1)
  if (/SELECT \* FROM users WHERE LOWER\(email\) = LOWER\(\$1\)/i.test(cleanSql)) {
    const email = (params[0] || '').toLowerCase();
    const user = mockUsers.find((u) => u.email.toLowerCase() === email);
    return { rows: user ? [user] : [] };
  }

  // Auth: SELECT ... FROM users WHERE user_id = $1
  if (/SELECT .* FROM users WHERE user_id = \$1/i.test(cleanSql) && !/role IN/i.test(cleanSql)) {
    const userId = parseInt(params[0], 10);
    const user = mockUsers.find((u) => u.user_id === userId);
    return { rows: user ? [user] : [] };
  }

  // Courses: Lecturer check SELECT user_id, role, full_name FROM users WHERE user_id = $1 AND role IN ('LECTURER', 'ADMIN')
  if (/FROM users WHERE user_id = \$1 AND role IN/i.test(cleanSql)) {
    const userId = parseInt(params[0], 10);
    const user = mockUsers.find((u) => u.user_id === userId && (u.role === 'LECTURER' || u.role === 'ADMIN'));
    return { rows: user ? [user] : [] };
  }

  // Courses: SELECT c.*, u.full_name as lecturer_name ... FROM courses c ...
  if (/FROM courses c/i.test(cleanSql)) {
    let list = mockCourses.map((c) => {
      const lec = mockUsers.find((u) => u.user_id === c.lecturer_id);
      return {
        ...c,
        lecturer_name: lec ? lec.full_name : 'Unknown',
        lecturer_email: lec ? lec.email : '',
      };
    });

    if (/WHERE c\.lecturer_id = \$1/i.test(cleanSql)) {
      const lecturerId = parseInt(params[0], 10);
      list = list.filter((c) => c.lecturer_id === lecturerId);
    } else if (/WHERE c\.course_id = \$1/i.test(cleanSql)) {
      const courseId = parseInt(params[0], 10);
      list = list.filter((c) => c.course_id === courseId);
    }
    return { rows: list };
  }

  // Courses: INSERT INTO courses ... RETURNING *
  if (/INSERT INTO courses/i.test(cleanSql)) {
    const [course_code, course_name, semester, lecturer_id] = params;
    const newId = mockCourses.length > 0 ? Math.max(...mockCourses.map((c) => c.course_id)) + 1 : 1;
    const newCourse: MockCourse = {
      course_id: newId,
      course_code,
      course_name,
      semester,
      lecturer_id: parseInt(lecturer_id, 10),
    };
    mockCourses.push(newCourse);
    return { rows: [newCourse] };
  }

  // Teams in course: SELECT t.team_id ... FROM teams t ... WHERE t.course_id = $1
  if (/FROM teams t/i.test(cleanSql) && /WHERE t\.course_id = \$1/i.test(cleanSql)) {
    const courseId = parseInt(params[0], 10);
    const teams = mockTeams.filter((t) => t.course_id === courseId);
    const rows = teams.map((t) => {
      const members = mockTeamMembers
        .filter((tm) => tm.team_id === t.team_id)
        .map((tm) => {
          const u = mockUsers.find((usr) => usr.user_id === tm.user_id);
          return {
            team_member_id: tm.team_member_id,
            user_id: tm.user_id,
            full_name: u?.full_name || '',
            email: u?.email || '',
            assigned_module: tm.assigned_module,
          };
        });
      return {
        ...t,
        members,
      };
    });
    return { rows };
  }

  // Teams: SELECT * FROM courses WHERE course_id = $1
  if (/SELECT \* FROM courses WHERE course_id = \$1/i.test(cleanSql)) {
    const courseId = parseInt(params[0], 10);
    const course = mockCourses.find((c) => c.course_id === courseId);
    return { rows: course ? [course] : [] };
  }

  // Teams: INSERT INTO teams ... RETURNING *
  if (/INSERT INTO teams/i.test(cleanSql)) {
    const [team_name, course_id, repo_url] = params;
    const newId = mockTeams.length > 0 ? Math.max(...mockTeams.map((t) => t.team_id)) + 1 : 1;
    const newTeam: MockTeam = {
      team_id: newId,
      team_name,
      course_id: parseInt(course_id, 10),
      repo_url,
    };
    mockTeams.push(newTeam);
    return { rows: [newTeam] };
  }

  // Teams detail: SELECT t.team_id ... WHERE t.team_id = $1
  if (/FROM teams t/i.test(cleanSql) && /WHERE t\.team_id = \$1/i.test(cleanSql)) {
    const teamId = parseInt(params[0], 10);
    const team = mockTeams.find((t) => t.team_id === teamId);
    if (!team) return { rows: [] };
    const course = mockCourses.find((c) => c.course_id === team.course_id);
    const lecturer = course ? mockUsers.find((u) => u.user_id === course.lecturer_id) : null;
    const members = mockTeamMembers
      .filter((tm) => tm.team_id === team.team_id)
      .map((tm) => {
        const u = mockUsers.find((usr) => usr.user_id === tm.user_id);
        return {
          team_member_id: tm.team_member_id,
          user_id: tm.user_id,
          full_name: u?.full_name || '',
          email: u?.email || '',
          assigned_module: tm.assigned_module,
        };
      });
    return {
      rows: [
        {
          team_id: team.team_id,
          team_name: team.team_name,
          repo_url: team.repo_url,
          course_id: team.course_id,
          course_code: course?.course_code || '',
          course_name: course?.course_name || '',
          semester: course?.semester || '',
          lecturer_id: course?.lecturer_id,
          lecturer_name: lecturer?.full_name || '',
          lecturer_email: lecturer?.email || '',
          members,
        },
      ],
    };
  }

  // Team members: check duplicate
  if (/SELECT team_member_id FROM team_members WHERE team_id = \$1 AND user_id = \$2/i.test(cleanSql)) {
    const teamId = parseInt(params[0], 10);
    const userId = parseInt(params[1], 10);
    const exists = mockTeamMembers.find((tm) => tm.team_id === teamId && tm.user_id === userId);
    return { rows: exists ? [{ team_member_id: exists.team_member_id }] : [] };
  }

  // Team members: INSERT INTO team_members ... RETURNING *
  if (/INSERT INTO team_members/i.test(cleanSql)) {
    const [team_id, user_id, assigned_module] = params;
    const newId = mockTeamMembers.length > 0 ? Math.max(...mockTeamMembers.map((tm) => tm.team_member_id)) + 1 : 1;
    const newMember: MockTeamMember = {
      team_member_id: newId,
      team_id: parseInt(team_id, 10),
      user_id: parseInt(user_id, 10),
      assigned_module,
    };
    mockTeamMembers.push(newMember);
    return { rows: [newMember] };
  }

  return { rows: [] };
}

const originalQuery = realPool.query.bind(realPool);

const resilientQuery = (async (sqlText: any, params?: any): Promise<any> => {
  if (typeof sqlText !== 'string') {
    return (originalQuery as any)(sqlText, params);
  }

  if (!isPostgresAvailable) {
    return executeMockQuery(sqlText, params);
  }

  try {
    const result = await (originalQuery as any)(sqlText, params);
    isPostgresAvailable = true;
    return result;
  } catch (err: any) {
    if (
      err.code === 'ECONNREFUSED' ||
      err.code === 'ETIMEDOUT' ||
      err.code === 'ENOTFOUND' ||
      err.message?.includes('connect ECONNREFUSED')
    ) {
      if (isPostgresAvailable) {
        console.warn('⚠️  PostgreSQL connection unavailable. Seamlessly running in Fallback In-Memory Mode with Seed Data.');
        isPostgresAvailable = false;
      }
      return executeMockQuery(sqlText, params);
    }
    throw err;
  }
}) as any;

(realPool as any).query = resilientQuery;

export const pool = realPool;


