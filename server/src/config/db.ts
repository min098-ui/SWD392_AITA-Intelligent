import { Pool } from 'pg';
import { EventEmitter } from 'events';
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
  status: 'ACTIVE' | 'PENDING' | 'LOCKED' | 'REJECTED';
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
  role?: 'LEADER' | 'MEMBER';
}

interface MockGitCommit {
  commit_id: number;
  team_id: number;
  author_user_id: number | null;
  commit_hash: string;
  message: string;
  lines_added: number;
  lines_deleted: number;
  committed_at: Date;
}

interface MockPeerAudit {
  audit_id: number;
  team_id: number;
  reviewer_id: number;
  reviewee_id: number;
  audit_round: number;
  score: number;
  comments: string;
  passed: boolean;
  created_at: Date;
}

const mockGitCommits: MockGitCommit[] = [];
const mockPeerAudits: MockPeerAudit[] = [];

interface MockAiApiKey {
  ai_api_key_id: number;
  provider: string;
  key_value_encrypted: string;
  api_key_encrypted?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'RATE_LIMITED' | 'EXHAUSTED';
  usage_count: number;
  rotated_at: Date | null;
  created_at: Date;
}

interface MockPromptTemplate {
  prompt_template_id: number;
  name: string;
  purpose: string;
  template_content: string;
  system_prompt?: string | null;
  temperature: number;
  version: string;
  is_active: boolean;
  created_at: Date;
}

interface MockTutorChatSession {
  session_id: number;
  user_id: number;
  submission_id?: number | null;
  assignment_id?: number | null;
  session_title: string;
  created_at: Date;
}

interface MockTutorChatMessage {
  message_id: number;
  session_id?: number | null;
  user_id: number;
  submission_id?: number | null;
  prompt_template_id?: number | null;
  ai_api_key_id?: number | null;
  sender_type: 'STUDENT' | 'AI';
  content: string;
  created_at: Date;
  sent_at: Date;
}

interface MockSubmission {
  submission_id: number;
  assignment_id: number;
  team_id?: number | null;
  submitted_by_user_id?: number | null;
  artifact_url: string;
  git_commit_hash: string;
  status: string;
  ai_score?: number | null;
  ai_feedback?: string | null;
  final_score?: number | null;
  submitted_at: Date;
}

interface MockGradingResult {
  grading_result_id: number;
  grading_job_id: number;
  rubric_rule_id: number;
  score: number;
  actual_output: string;
  passed: boolean;
  execution_time_ms: number;
  ai_feedback?: string | null;
  is_ai_generated: boolean;
  graded_at: Date;
}

interface MockRubricRule {
  rubric_rule_id: number;
  assignment_id: number;
  rule_type: string;
  criterion: string;
  expected_output?: string | null;
  input_data?: string | null;
  max_score: number;
}

const mockAiApiKeys: MockAiApiKey[] = [
  {
    ai_api_key_id: 1,
    provider: 'Google-Gemini',
    key_value_encrypted: 'enc_gemini_api_key_mock_value_xxxx1234',
    api_key_encrypted: 'enc_gemini_api_key_mock_value_xxxx1234',
    status: 'ACTIVE',
    usage_count: 42,
    rotated_at: new Date(),
    created_at: new Date(),
  },
  {
    ai_api_key_id: 2,
    provider: 'OpenAI',
    key_value_encrypted: 'enc_openai_api_key_mock_value_yyyy5678',
    api_key_encrypted: 'enc_openai_api_key_mock_value_yyyy5678',
    status: 'ACTIVE',
    usage_count: 15,
    rotated_at: new Date(),
    created_at: new Date(),
  },
];

const mockPromptTemplates: MockPromptTemplate[] = [
  {
    prompt_template_id: 1,
    name: 'Code Grading Feedback Prompt',
    purpose: 'Grading',
    template_content: 'You are an expert AI Teaching Assistant for Software Engineering. Evaluate Clean Code, AST, and Design Patterns.',
    system_prompt: 'Evaluate student code for Clean Code, AST structure and design patterns.',
    temperature: 0.2,
    version: 'v1.0',
    is_active: true,
    created_at: new Date(),
  },
  {
    prompt_template_id: 2,
    name: 'Interactive AI Tutor Chat Prompt',
    purpose: 'TutorChat',
    template_content: 'You are AITA, a friendly and knowledgeable AI coding tutor for university students. Guide using Socratic method.',
    system_prompt: 'Apply Socratic method: guide thinking, never give complete code directly.',
    temperature: 0.2,
    version: 'v1.0',
    is_active: true,
    created_at: new Date(),
  },
];

const mockTutorChatSessions: MockTutorChatSession[] = [];
const mockTutorChatMessages: MockTutorChatMessage[] = [];
const mockSubmissions: MockSubmission[] = [
  {
    submission_id: 1,
    assignment_id: 1,
    team_id: 1,
    submitted_by_user_id: 6,
    artifact_url: 'console.log("Hello")',
    git_commit_hash: 'c1a2b3d4e5f6',
    status: 'SUBMITTED',
    submitted_at: new Date(),
  },
];
const mockGradingResults: MockGradingResult[] = [];
const mockRubricRules: MockRubricRule[] = [
  {
    rubric_rule_id: 1,
    assignment_id: 1,
    rule_type: 'UNIT_TEST',
    criterion: 'Basic tests',
    max_score: 5.0,
  },
  {
    rubric_rule_id: 999,
    assignment_id: 999,
    rule_type: 'AI_ANALYSIS',
    criterion: 'Code Style & Design Patterns',
    max_score: 10.0,
  },
];

const mockUsers: MockUser[] = [
  {
    user_id: 1,
    full_name: 'System Administrator',
    email: 'admin@fpt.edu.vn',
    password_hash: '$2a$10$fUyXvogZImWkD34ItWppmenaSNAgzilb7Ml7ZQ5DCx0OvRo3.RfX2',
    role: 'ADMIN',
    status: 'ACTIVE',
    created_at: new Date(),
  },
  {
    user_id: 2,
    full_name: 'Dr. Nguyen Van Giang',
    email: 'giangnv@fe.edu.vn',
    password_hash: '$2a$10$fUyXvogZImWkD34ItWppmenaSNAgzilb7Ml7ZQ5DCx0OvRo3.RfX2',
    role: 'LECTURER',
    status: 'ACTIVE',
    created_at: new Date(),
  },
  {
    user_id: 6,
    full_name: 'Lê Nguyễn Ánh Mai',
    email: 'lenguyenlinhnhi2110@gmail.com',
    password_hash: '$2a$10$fUyXvogZImWkD34ItWppmenaSNAgzilb7Ml7ZQ5DCx0OvRo3.RfX2',
    role: 'STUDENT',
    status: 'ACTIVE',
    created_at: new Date(),
  },
  {
    user_id: 7,
    full_name: 'AMai',
    email: 'lenguyenanhmai05@gmail.com',
    password_hash: 'OAUTH_GOOGLE',
    role: 'ADMIN',
    status: 'ACTIVE',
    created_at: new Date(),
  },
  {
    user_id: 8,
    full_name: 'Tuong Vy',
    email: 'tuongvy22102004@gmail.com',
    password_hash: 'OAUTH_GOOGLE',
    role: 'ADMIN',
    status: 'ACTIVE',
    created_at: new Date(),
  },
  {
    user_id: 9,
    full_name: 'Đinh Gia Huy',
    email: 'dinhgiahuylol12345@gmail.com',
    password_hash: '$2a$10$fUyXvogZImWkD34ItWppmenaSNAgzilb7Ml7ZQ5DCx0OvRo3.RfX2',
    role: 'STUDENT',
    status: 'ACTIVE',
    created_at: new Date(),
  },
  {
    user_id: 10,
    full_name: 'Đỗ Trần Đăng Khoa',
    email: 'dotrandangkhoa17@gmail.com',
    password_hash: '$2a$10$fUyXvogZImWkD34ItWppmenaSNAgzilb7Ml7ZQ5DCx0OvRo3.RfX2',
    role: 'STUDENT',
    status: 'ACTIVE',
    created_at: new Date(),
  },
  {
    user_id: 11,
    full_name: 'Nguyễn Tường Vy',
    email: 'vyntqe180099@fpt.edu.vn',
    password_hash: '$2a$10$fUyXvogZImWkD34ItWppmenaSNAgzilb7Ml7ZQ5DCx0OvRo3.RfX2',
    role: 'STUDENT',
    status: 'ACTIVE',
    created_at: new Date(),
  },
  {
    user_id: 12,
    full_name: 'Nguyễn Quốc Thanh Phong',
    email: 'tfongcs05@gmail.com',
    password_hash: '$2a$10$fUyXvogZImWkD34ItWppmenaSNAgzilb7Ml7ZQ5DCx0OvRo3.RfX2',
    role: 'STUDENT',
    status: 'ACTIVE',
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
    repo_url: 'https://github.com/min098-ui/SWD392_AITA-Intelligent',
  },
];

const mockTeamMembers: MockTeamMember[] = [
  {
    team_member_id: 1,
    team_id: 1,
    user_id: 6,
    assigned_module: 'Software Architecture, Auth & Course Core',
    role: 'LEADER',
  },
  {
    team_member_id: 2,
    team_id: 1,
    user_id: 9,
    assigned_module: 'Docker Sandbox Runner & Async Grading Queue',
    role: 'MEMBER',
  },
  {
    team_member_id: 3,
    team_id: 1,
    user_id: 10,
    assigned_module: 'AI Engine, Socratic Tutor & Key Rotation',
    role: 'MEMBER',
  },
  {
    team_member_id: 4,
    team_id: 1,
    user_id: 11,
    assigned_module: 'Git Analytics, Noise Filter & Peer Audit',
    role: 'MEMBER',
  },
  {
    team_member_id: 5,
    team_id: 1,
    user_id: 12,
    assigned_module: 'Frontend Web App (Next.js 14) & UI/UX',
    role: 'MEMBER',
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
    let user_id: number;
    let full_name: string = 'User';
    let email: string = '';
    let password_hash: string = '';
    let role: 'ADMIN' | 'LECTURER' | 'STUDENT' = 'STUDENT';
    let status: 'ACTIVE' | 'PENDING' | 'LOCKED' | 'REJECTED' = 'ACTIVE';

    if (params && params.length >= 4) {
      if (params.length >= 6) {
        [user_id, full_name, email, password_hash, role, status] = params;
      } else if (params.length === 5) {
        if (typeof params[0] === 'number') {
          [user_id, full_name, email, password_hash, role] = params;
          status = role === 'LECTURER' ? 'PENDING' : 'ACTIVE';
        } else {
          [full_name, email, password_hash, role, status] = params;
          user_id = mockUsers.length > 0 ? Math.max(...mockUsers.map((u) => u.user_id)) + 1 : 1;
        }
      } else {
        [full_name, email, password_hash, role] = params;
        user_id = mockUsers.length > 0 ? Math.max(...mockUsers.map((u) => u.user_id)) + 1 : 1;
        status = role === 'LECTURER' ? 'PENDING' : 'ACTIVE';
      }
    } else {
      const valuesMatch = cleanSql.match(/VALUES\s*\(([^)]+)\)/i);
      if (valuesMatch) {
        const parts = valuesMatch[1].split(',').map((p) => p.trim().replace(/^['"]|['"]$/g, ''));
        if (!isNaN(Number(parts[0]))) {
          user_id = Number(parts[0]);
          full_name = parts[1] || 'User';
          email = parts[2] || '';
          password_hash = parts[3] || '';
          role = (parts[4] as any) || 'STUDENT';
          status = (parts[5] as any) || (role === 'LECTURER' ? 'PENDING' : 'ACTIVE');
        } else {
          user_id = mockUsers.length > 0 ? Math.max(...mockUsers.map((u) => u.user_id)) + 1 : 1;
          full_name = parts[0] || 'User';
          email = parts[1] || '';
          password_hash = parts[2] || '';
          role = (parts[3] as any) || 'STUDENT';
          status = (parts[4] as any) || (role === 'LECTURER' ? 'PENDING' : 'ACTIVE');
        }
      } else {
        user_id = mockUsers.length > 0 ? Math.max(...mockUsers.map((u) => u.user_id)) + 1 : 1;
      }
    }

    const existing = mockUsers.find(
      (u) => (email && u.email.toLowerCase() === email.toLowerCase()) || (user_id && u.user_id === user_id)
    );
    if (existing) {
      if (cleanSql.includes('ON CONFLICT')) {
        return { rows: [existing] };
      }
      const err: any = new Error('duplicate key value violates unique constraint');
      err.code = '23505';
      throw err;
    }
    const targetRole = role || 'STUDENT';
    const targetStatus = status || (targetRole === 'LECTURER' ? 'PENDING' : 'ACTIVE');
    const newUser: MockUser = {
      user_id,
      full_name,
      email,
      password_hash,
      role: targetRole,
      status: targetStatus,
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

  // Auth: SELECT user_id, full_name, email, role, status, created_at FROM users
  if (/FROM users/i.test(cleanSql) && !/WHERE/i.test(cleanSql)) {
    return { rows: mockUsers.map(u => ({ user_id: u.user_id, full_name: u.full_name, email: u.email, role: u.role, status: u.status, created_at: u.created_at })) };
  }
  if (/FROM users WHERE role = \$1/i.test(cleanSql)) {
    const role = params[0];
    return { rows: mockUsers.filter(u => u.role === role).map(u => ({ user_id: u.user_id, full_name: u.full_name, email: u.email, role: u.role, status: u.status, created_at: u.created_at })) };
  }

  // Auth: UPDATE users SET status = $1 WHERE user_id = $2
  if (/UPDATE users SET status = \$1 WHERE user_id = \$2/i.test(cleanSql)) {
    const [status, userId] = params;
    const user = mockUsers.find(u => u.user_id === parseInt(userId, 10));
    if (user) {
      user.status = status;
      return { rows: [{ user_id: user.user_id, full_name: user.full_name, email: user.email, role: user.role, status: user.status }] };
    }
    return { rows: [] };
  }

  // Auth: UPDATE users SET role = $1 WHERE user_id = $2
  if (/UPDATE users SET role = \$1 WHERE user_id = \$2/i.test(cleanSql)) {
    const [role, userId] = params;
    const user = mockUsers.find(u => u.user_id === parseInt(userId, 10));
    if (user) {
      user.role = role;
      return { rows: [{ user_id: user.user_id, full_name: user.full_name, email: user.email, role: user.role }] };
    }
    return { rows: [] };
  }

  // Auth: UPDATE users SET role = 'ADMIN', status = 'ACTIVE' WHERE user_id = $1
  if (/UPDATE users SET role = 'ADMIN'/i.test(cleanSql)) {
    const userId = parseInt(params[0], 10);
    const user = mockUsers.find(u => u.user_id === userId);
    if (user) {
      user.role = 'ADMIN';
      user.status = 'ACTIVE';
      return { rows: [user] };
    }
    return { rows: [] };
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

  // Teams detail / fetch: SELECT ... FROM teams ... WHERE team_id = $1
  if (/FROM teams/i.test(cleanSql) && /WHERE (t\.)?team_id = \$1/i.test(cleanSql)) {
    const teamId = parseInt(params[0], 10);
    const team = mockTeams.find((t) => t.team_id === teamId);
    if (!team) return { rows: [] };

    if (/members/i.test(cleanSql) || /course_code/i.test(cleanSql) || /FROM teams t/i.test(cleanSql)) {
      const course = mockCourses.find((c) => c.course_id === team.course_id);
      const lecturer = course ? mockUsers.find((u) => u.user_id === course.lecturer_id) : null;
      const members = mockTeamMembers
        .filter((tm) => tm.team_id === team.team_id)
        .sort((a, b) => (a.role === 'LEADER' ? -1 : b.role === 'LEADER' ? 1 : 0))
        .map((tm) => {
          const u = mockUsers.find((usr) => usr.user_id === tm.user_id);
          return {
            team_member_id: tm.team_member_id,
            user_id: tm.user_id,
            full_name: u?.full_name || '',
            email: u?.email || '',
            assigned_module: tm.assigned_module,
            role: tm.role || 'MEMBER',
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
    return { rows: [team] };
  }

  // Team members with users join: SELECT u.user_id, u.full_name, u.email FROM team_members tm JOIN users u ...
  if (/FROM team_members tm/i.test(cleanSql) && /JOIN users u/i.test(cleanSql) && !/git_commits/i.test(cleanSql) && !/peer_audits/i.test(cleanSql)) {
    const teamId = parseInt(params[0], 10);
    const tms = mockTeamMembers.filter((tm) => tm.team_id === teamId);
    const rows = tms.map((tm) => {
      const u = mockUsers.find((usr) => usr.user_id === tm.user_id);
      return {
        user_id: tm.user_id,
        full_name: u?.full_name || '',
        email: u?.email || '',
        assigned_module: tm.assigned_module,
      };
    });
    return { rows };
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
    let team_id: number;
    let user_id: number;
    let assigned_module: string = '';

    if (params && params.length >= 2) {
      team_id = parseInt(params[0], 10);
      user_id = parseInt(params[1], 10);
      assigned_module = params[2] || '';
    } else {
      const valuesMatch = cleanSql.match(/VALUES\s*\(([^)]+)\)/i);
      if (valuesMatch) {
        const parts = valuesMatch[1].split(',').map((p) => p.trim().replace(/^['"]|['"]$/g, ''));
        team_id = parseInt(parts[0], 10);
        user_id = parseInt(parts[1], 10);
        assigned_module = parts[2] || '';
      } else {
        team_id = 1;
        user_id = 1;
      }
    }

    const existing = mockTeamMembers.find((tm) => tm.team_id === team_id && tm.user_id === user_id);
    if (existing) {
      existing.assigned_module = assigned_module;
      return { rows: [existing] };
    }

    const newId = mockTeamMembers.length > 0 ? Math.max(...mockTeamMembers.map((tm) => tm.team_member_id)) + 1 : 1;
    const newMember: MockTeamMember = {
      team_member_id: newId,
      team_id,
      user_id,
      assigned_module,
    };
    mockTeamMembers.push(newMember);
    return { rows: [newMember] };
  }

  // Git commits: INSERT INTO git_commits
  if (/INSERT INTO git_commits/i.test(cleanSql)) {
    let team_id: number = 1;
    let author_user_id: number | null = null;
    let commit_hash: string = '';
    let message: string = '';
    let lines_added: number = 0;
    let lines_deleted: number = 0;
    let committed_at: Date = new Date();

    if (params && params.length >= 6) {
      team_id = parseInt(params[0], 10);
      author_user_id = params[1] ? parseInt(params[1], 10) : null;
      commit_hash = params[2];
      message = params[3] || '';
      lines_added = parseInt(params[4], 10) || 0;
      lines_deleted = parseInt(params[5], 10) || 0;
      committed_at = params[6] || new Date();
    } else {
      const valuesMatch = cleanSql.match(/VALUES\s*\(([^)]+)\)/i);
      if (valuesMatch) {
        const parts = valuesMatch[1].split(',').map((p) => p.trim().replace(/^['"]|['"]$/g, ''));
        team_id = parseInt(parts[0], 10);
        author_user_id = parts[1] && parts[1] !== 'null' ? parseInt(parts[1], 10) : null;
        commit_hash = parts[2] || '';
        message = parts[3] || '';
        lines_added = parseInt(parts[4], 10) || 0;
        lines_deleted = parseInt(parts[5], 10) || 0;
        committed_at = new Date();
      }
    }

    const existingIdx = mockGitCommits.findIndex((c) => c.commit_hash === commit_hash);
    const newCommit: MockGitCommit = {
      commit_id: existingIdx >= 0 ? mockGitCommits[existingIdx].commit_id : mockGitCommits.length + 1,
      team_id,
      author_user_id,
      commit_hash,
      message,
      lines_added,
      lines_deleted,
      committed_at,
    };

    if (existingIdx >= 0) {
      mockGitCommits[existingIdx] = newCommit;
    } else {
      mockGitCommits.push(newCommit);
    }
    return { rows: [newCommit] };
  }

  // Git commits: SELECT c.*, u.full_name as author_name ... FROM git_commits c ...
  if (/FROM git_commits c/i.test(cleanSql)) {
    const teamId = parseInt(params[0], 10);
    const commits = mockGitCommits
      .filter((c) => c.team_id === teamId)
      .map((c) => {
        const u = mockUsers.find((usr) => usr.user_id === c.author_user_id);
        return {
          commit_id: c.commit_id,
          team_id: c.team_id,
          author_user_id: c.author_user_id,
          commit_hash: c.commit_hash,
          message: c.message,
          lines_added: c.lines_added,
          lines_deleted: c.lines_deleted,
          committed_at: c.committed_at,
          author_name: u?.full_name || 'Unknown',
          author_email: u?.email || '',
        };
      });
    return { rows: commits };
  }

  // Git stats: SELECT u.user_id ... FROM team_members tm JOIN users u ... LEFT JOIN git_commits c ...
  if (/FROM team_members tm/i.test(cleanSql) && /git_commits c/i.test(cleanSql)) {
    const teamId = parseInt(params[0], 10);
    const tms = mockTeamMembers.filter((tm) => tm.team_id === teamId);
    const rows = tms.map((tm) => {
      const u = mockUsers.find((usr) => usr.user_id === tm.user_id);
      const userCommits = mockGitCommits.filter((c) => c.team_id === teamId && c.author_user_id === tm.user_id);
      const total_lines_added = userCommits.reduce((acc, c) => acc + c.lines_added, 0);
      const total_lines_deleted = userCommits.reduce((acc, c) => acc + c.lines_deleted, 0);
      return {
        user_id: tm.user_id,
        full_name: u?.full_name || '',
        email: u?.email || '',
        assigned_module: tm.assigned_module,
        total_commits: userCommits.length,
        total_lines_added,
        total_lines_deleted,
      };
    });
    return { rows };
  }

  // Peer audits: check duplicate
  if (/SELECT audit_id FROM peer_audits/i.test(cleanSql)) {
    const [team_id, reviewer_id, reviewee_id, audit_round] = params;
    const existing = mockPeerAudits.find(
      (pa) =>
        pa.team_id === parseInt(team_id, 10) &&
        pa.reviewer_id === parseInt(reviewer_id, 10) &&
        pa.reviewee_id === parseInt(reviewee_id, 10) &&
        pa.audit_round === parseInt(audit_round, 10)
    );
    return { rows: existing ? [{ audit_id: existing.audit_id }] : [] };
  }

  // Peer audits: INSERT INTO peer_audits
  if (/INSERT INTO peer_audits/i.test(cleanSql)) {
    const [team_id, reviewer_id, reviewee_id, audit_round, score, comments, passed] = params;
    const newId = mockPeerAudits.length > 0 ? Math.max(...mockPeerAudits.map((pa) => pa.audit_id)) + 1 : 1;
    const newAudit: MockPeerAudit = {
      audit_id: newId,
      team_id: parseInt(team_id, 10),
      reviewer_id: parseInt(reviewer_id, 10),
      reviewee_id: parseInt(reviewee_id, 10),
      audit_round: parseInt(audit_round, 10),
      score: parseFloat(score),
      comments: comments || '',
      passed: passed !== undefined ? Boolean(passed) : true,
      created_at: new Date(),
    };
    mockPeerAudits.push(newAudit);
    return { rows: [newAudit] };
  }

  // Peer audits: UPDATE peer_audits
  if (/UPDATE peer_audits/i.test(cleanSql)) {
    const [score, comments, passed, audit_id] = params;
    const audit = mockPeerAudits.find((pa) => pa.audit_id === parseInt(audit_id, 10));
    if (audit) {
      audit.score = parseFloat(score);
      audit.comments = comments || '';
      audit.passed = Boolean(passed);
      return { rows: [audit] };
    }
    return { rows: [] };
  }

  // Peer audits: SELECT pa.*, r1.full_name as reviewer_name ... FROM peer_audits pa ...
  if (/FROM peer_audits pa/i.test(cleanSql)) {
    const teamId = parseInt(params[0], 10);
    const audits = mockPeerAudits
      .filter((pa) => pa.team_id === teamId)
      .map((pa) => {
        const r1 = mockUsers.find((u) => u.user_id === pa.reviewer_id);
        const r2 = mockUsers.find((u) => u.user_id === pa.reviewee_id);
        return {
          audit_id: pa.audit_id,
          team_id: pa.team_id,
          reviewer_id: pa.reviewer_id,
          reviewee_id: pa.reviewee_id,
          audit_round: pa.audit_round,
          score: pa.score,
          comments: pa.comments,
          passed: pa.passed,
          created_at: pa.created_at,
          reviewer_name: r1?.full_name || '',
          reviewer_email: r1?.email || '',
          reviewee_name: r2?.full_name || '',
          reviewee_email: r2?.email || '',
        };
      });
    return { rows: audits };
  }

  // Peer audit summary: FROM team_members tm ... LEFT JOIN peer_audits pa ...
  if (/FROM team_members tm/i.test(cleanSql) && /peer_audits pa/i.test(cleanSql)) {
    const teamId = parseInt(params[0], 10);
    const tms = mockTeamMembers.filter((tm) => tm.team_id === teamId);
    const rows = tms.map((tm) => {
      const u = mockUsers.find((usr) => usr.user_id === tm.user_id);
      const receivedAudits = mockPeerAudits.filter((pa) => pa.team_id === teamId && pa.reviewee_id === tm.user_id);
      const total_reviews_received = receivedAudits.length;
      const avgScore =
        total_reviews_received > 0
          ? (receivedAudits.reduce((acc, pa) => acc + pa.score, 0) / total_reviews_received).toFixed(2)
          : '0.00';
      const feedback_comments = receivedAudits.map((pa) => {
        const rev = mockUsers.find((usr) => usr.user_id === pa.reviewer_id);
        return {
          reviewer_name: rev?.full_name || '',
          score: pa.score,
          comments: pa.comments,
          audit_round: pa.audit_round,
          created_at: pa.created_at,
        };
      });
      return {
        user_id: tm.user_id,
        full_name: u?.full_name || '',
        email: u?.email || '',
        assigned_module: tm.assigned_module,
        total_reviews_received,
        average_score: avgScore,
        peer_consensus_passed: receivedAudits.length > 0 ? receivedAudits.every((pa) => pa.passed) : true,
        feedback_comments,
      };
    });
    return { rows };
  }

  // Transactions (BEGIN, COMMIT, ROLLBACK)
  if (/^(BEGIN|COMMIT|ROLLBACK)/i.test(cleanSql)) {
    return { rows: [] };
  }

  // AI API Keys: getNextActiveApiKey (SELECT ... FROM ai_api_keys WHERE status = 'ACTIVE' ORDER BY usage_count ASC)
  if (/FROM ai_api_keys/i.test(cleanSql) && /status = 'ACTIVE'/i.test(cleanSql) && /ORDER BY usage_count/i.test(cleanSql)) {
    const activeKeys = mockAiApiKeys
      .filter((k) => k.status === 'ACTIVE')
      .sort((a, b) => a.usage_count - b.usage_count || a.ai_api_key_id - b.ai_api_key_id);
    return { rows: activeKeys.length > 0 ? [activeKeys[0]] : [] };
  }

  // AI API Keys: UPDATE status (markKeyRateLimited or status patch)
  if (/UPDATE ai_api_keys SET status = \$1/i.test(cleanSql)) {
    const [status, keyId] = params;
    const key = mockAiApiKeys.find((k) => k.ai_api_key_id === Number(keyId));
    if (key) {
      key.status = status;
      key.rotated_at = new Date();
      return { rows: [key] };
    }
    return { rows: [] };
  }

  // AI API Keys: UPDATE usage_count (incrementKeyUsage)
  if (/UPDATE ai_api_keys SET usage_count = usage_count \+ 1/i.test(cleanSql)) {
    const keyId = Number(params[0]);
    const key = mockAiApiKeys.find((k) => k.ai_api_key_id === keyId);
    if (key) {
      key.usage_count += 1;
      key.rotated_at = new Date();
      return { rows: [key] };
    }
    return { rows: [] };
  }

  // AI API Keys: SELECT * FROM ai_api_keys ORDER BY ai_api_key_id ASC
  if (/FROM ai_api_keys/i.test(cleanSql) && !/WHERE/i.test(cleanSql)) {
    return { rows: [...mockAiApiKeys].sort((a, b) => a.ai_api_key_id - b.ai_api_key_id) };
  }

  // AI API Keys: INSERT INTO ai_api_keys
  if (/INSERT INTO ai_api_keys/i.test(cleanSql)) {
    const [provider, key_val] = params;
    const newId = mockAiApiKeys.length > 0 ? Math.max(...mockAiApiKeys.map((k) => k.ai_api_key_id)) + 1 : 1;
    const newKey: MockAiApiKey = {
      ai_api_key_id: newId,
      provider: provider || 'Google-Gemini',
      key_value_encrypted: key_val,
      api_key_encrypted: key_val,
      status: 'ACTIVE',
      usage_count: 0,
      rotated_at: null,
      created_at: new Date(),
    };
    mockAiApiKeys.push(newKey);
    return { rows: [newKey] };
  }

  // Prompt Templates: SELECT by purpose
  if (/FROM prompt_templates/i.test(cleanSql) && /purpose =/i.test(cleanSql)) {
    let purpose = '';
    const match = cleanSql.match(/purpose = '([^']+)'/i);
    if (match) {
      purpose = match[1];
    } else if (params && params.length > 0) {
      purpose = params[0];
    }
    const filtered = mockPromptTemplates.filter((p) => !purpose || p.purpose.toLowerCase() === purpose.toLowerCase());
    return { rows: filtered.sort((a, b) => b.prompt_template_id - a.prompt_template_id) };
  }

  // Prompt Templates: SELECT * FROM prompt_templates
  if (/FROM prompt_templates/i.test(cleanSql)) {
    return { rows: [...mockPromptTemplates].sort((a, b) => a.prompt_template_id - b.prompt_template_id) };
  }

  // Prompt Templates: INSERT INTO prompt_templates
  if (/INSERT INTO prompt_templates/i.test(cleanSql)) {
    const [name, purpose, template_content, system_prompt, version, temperature] = params;
    const newId = mockPromptTemplates.length > 0 ? Math.max(...mockPromptTemplates.map((p) => p.prompt_template_id)) + 1 : 1;
    const newTemplate: MockPromptTemplate = {
      prompt_template_id: newId,
      name,
      purpose,
      template_content,
      system_prompt: system_prompt || null,
      temperature: temperature !== undefined ? parseFloat(temperature) : 0.2,
      version: version || 'v1.0',
      is_active: true,
      created_at: new Date(),
    };
    mockPromptTemplates.push(newTemplate);
    return { rows: [newTemplate] };
  }

  // Tutor Chat Sessions: INSERT INTO tutor_chat_sessions
  if (/INSERT INTO tutor_chat_sessions/i.test(cleanSql)) {
    const [user_id, submission_id, assignment_id, session_title] = params;
    const newId = mockTutorChatSessions.length > 0 ? Math.max(...mockTutorChatSessions.map((s) => s.session_id)) + 1 : 1;
    const newSession: MockTutorChatSession = {
      session_id: newId,
      user_id: Number(user_id),
      submission_id: submission_id ? Number(submission_id) : null,
      assignment_id: assignment_id ? Number(assignment_id) : null,
      session_title: session_title || 'New Session',
      created_at: new Date(),
    };
    mockTutorChatSessions.push(newSession);
    return { rows: [newSession] };
  }

  // Tutor Chat Sessions: SELECT * FROM tutor_chat_sessions WHERE session_id = $1
  if (/FROM tutor_chat_sessions/i.test(cleanSql) && /session_id = \$1/i.test(cleanSql)) {
    const sessionId = Number(params[0]);
    const session = mockTutorChatSessions.find((s) => s.session_id === sessionId);
    return { rows: session ? [session] : [] };
  }

  // Tutor Chat Messages: INSERT INTO tutor_chat_messages
  if (/INSERT INTO tutor_chat_messages/i.test(cleanSql)) {
    const newId = mockTutorChatMessages.length > 0 ? Math.max(...mockTutorChatMessages.map((m) => m.message_id)) + 1 : 1;
    let newMsg: MockTutorChatMessage;
    if (params.length === 6 && typeof params[0] === 'number') {
      const [session_id, user_id, submission_id, prompt_template_id, ai_api_key_id, content] = params;
      const sender = cleanSql.includes("'STUDENT'") ? 'STUDENT' : 'AI';
      newMsg = {
        message_id: newId,
        session_id: session_id ? Number(session_id) : null,
        user_id: Number(user_id),
        submission_id: submission_id ? Number(submission_id) : null,
        prompt_template_id: prompt_template_id ? Number(prompt_template_id) : null,
        ai_api_key_id: ai_api_key_id ? Number(ai_api_key_id) : null,
        sender_type: sender,
        content: content || '',
        created_at: new Date(),
        sent_at: new Date(),
      };
    } else {
      const [user_id, submission_id, prompt_template_id, ai_api_key_id, content] = params;
      const sender = cleanSql.includes("'STUDENT'") ? 'STUDENT' : 'AI';
      newMsg = {
        message_id: newId,
        session_id: null,
        user_id: Number(user_id),
        submission_id: submission_id ? Number(submission_id) : null,
        prompt_template_id: prompt_template_id ? Number(prompt_template_id) : null,
        ai_api_key_id: ai_api_key_id ? Number(ai_api_key_id) : null,
        sender_type: sender,
        content: content || '',
        created_at: new Date(),
        sent_at: new Date(),
      };
    }
    mockTutorChatMessages.push(newMsg);
    return { rows: [newMsg] };
  }

  // Tutor Chat Messages: SELECT by session_id
  if (/FROM tutor_chat_messages/i.test(cleanSql) && /session_id = \$1/i.test(cleanSql)) {
    const sessionId = Number(params[0]);
    const messages = mockTutorChatMessages
      .filter((m) => m.session_id === sessionId)
      .map((m) => {
        const u = mockUsers.find((usr) => usr.user_id === m.user_id);
        return {
          ...m,
          student_name: u?.full_name || 'Student',
        };
      });
    return { rows: messages };
  }

  // Tutor Chat Messages: SELECT by submission_id
  if (/FROM tutor_chat_messages/i.test(cleanSql) && /submission_id = \$1/i.test(cleanSql)) {
    const subId = Number(params[0]);
    const messages = mockTutorChatMessages
      .filter((m) => m.submission_id === subId)
      .map((m) => {
        const u = mockUsers.find((usr) => usr.user_id === m.user_id);
        return {
          ...m,
          student_name: u?.full_name || 'Student',
        };
      });
    return { rows: messages };
  }

  // Assignments: INSERT INTO assignments
  if (/INSERT INTO assignments/i.test(cleanSql)) {
    return { rows: [] };
  }

  // Rubric rules: INSERT INTO rubric_rules
  if (/INSERT INTO rubric_rules/i.test(cleanSql)) {
    let ruleId = 999;
    let assignmentId = 999;
    let ruleType = 'AI_ANALYSIS';
    let criterion = 'Code Style';
    let maxScore = 10.0;
    if (params && params.length >= 5) {
      [ruleId, assignmentId, ruleType, criterion, maxScore] = params;
    } else {
      const match = cleanSql.match(/VALUES\s*\(([^)]+)\)/i);
      if (match) {
        const parts = match[1].split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, ''));
        ruleId = Number(parts[0]) || 999;
        assignmentId = Number(parts[1]) || 999;
        ruleType = parts[2] || 'AI_ANALYSIS';
        criterion = parts[3] || 'Code Style';
        maxScore = parseFloat(parts[4]) || 10.0;
      }
    }
    const existing = mockRubricRules.find((r) => r.rubric_rule_id === Number(ruleId));
    if (!existing) {
      mockRubricRules.push({
        rubric_rule_id: Number(ruleId),
        assignment_id: Number(assignmentId),
        rule_type: ruleType,
        criterion,
        max_score: Number(maxScore),
      });
    }
    return { rows: [] };
  }

  // Rubric rules: SELECT FROM rubric_rules
  if (/FROM rubric_rules/i.test(cleanSql)) {
    let assignmentId: number | null = null;
    const match = cleanSql.match(/assignment_id\s*=\s*(\d+|\$1)/i);
    if (match) {
      if (match[1] === '$1' && params && params.length > 0) {
        assignmentId = Number(params[0]);
      } else {
        assignmentId = Number(match[1]);
      }
    }
    const rules = assignmentId !== null
      ? mockRubricRules.filter((r) => r.assignment_id === assignmentId)
      : mockRubricRules;
    return { rows: rules };
  }

  // Submissions: INSERT INTO submissions
  if (/INSERT INTO submissions/i.test(cleanSql)) {
    let subId = 999;
    let assignmentId = 999;
    let artifactUrl = '';
    let gitCommitHash = '';
    let status = 'SUBMITTED';
    if (params && params.length >= 5) {
      [subId, assignmentId, artifactUrl, gitCommitHash, status] = params;
    } else {
      const match = cleanSql.match(/VALUES\s*\(([^)]+)\)/i);
      if (match) {
        const parts = match[1].split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, ''));
        subId = Number(parts[0]) || 999;
        assignmentId = Number(parts[1]) || 999;
        artifactUrl = parts[2] || '';
        gitCommitHash = parts[3] || '';
        status = parts[4] || 'SUBMITTED';
      }
    }
    const existing = mockSubmissions.find((s) => s.submission_id === Number(subId));
    if (!existing) {
      mockSubmissions.push({
        submission_id: Number(subId),
        assignment_id: Number(assignmentId),
        artifact_url: artifactUrl,
        git_commit_hash: gitCommitHash,
        status: status || 'SUBMITTED',
        submitted_at: new Date(),
      });
    }
    return { rows: [] };
  }

  // Grading jobs: UPDATE grading_jobs
  if (/UPDATE grading_jobs/i.test(cleanSql)) {
    return { rows: [] };
  }

  // Submissions: UPDATE submissions (grading worker)
  if (/UPDATE submissions/i.test(cleanSql)) {
    let subId: number | null = null;
    const match = cleanSql.match(/submission_id\s*=\s*(\d+|\$(\d+))/i);
    if (match) {
      if (match[1].startsWith('$')) {
        const paramIndex = Number(match[2]) - 1;
        subId = Number(params[paramIndex]);
      } else {
        subId = Number(match[1]);
      }
    } else if (params && params.length > 0) {
      subId = Number(params[params.length - 1]);
    }
    const sub = mockSubmissions.find((s) => s.submission_id === subId);
    if (sub) {
      if (params && params.length === 3) {
        sub.status = 'GRADED';
        sub.ai_score = parseFloat(params[0]);
        sub.ai_feedback = params[1];
        sub.final_score = parseFloat(params[0]);
      } else if (params && params.length === 2) {
        sub.status = 'GRADED';
        sub.ai_score = parseFloat(params[0]);
        sub.final_score = parseFloat(params[0]);
      } else if (cleanSql.includes("status = 'GRADING'")) {
        sub.status = 'GRADING';
      }
      return { rows: [sub] };
    }
    return { rows: [] };
  }

  // Submissions: SELECT FROM submissions
  if (/FROM submissions/i.test(cleanSql)) {
    let subId: number | null = null;
    const match = cleanSql.match(/submission_id\s*=\s*(\d+|\$1)/i);
    if (match) {
      if (match[1] === '$1' && params && params.length > 0) {
        subId = Number(params[0]);
      } else {
        subId = Number(match[1]);
      }
    }
    if (subId !== null) {
      const sub = mockSubmissions.find((s) => s.submission_id === subId);
      return { rows: sub ? [sub] : [] };
    }
    return { rows: mockSubmissions };
  }

  // Grading results: INSERT INTO grading_results
  if (/INSERT INTO grading_results/i.test(cleanSql)) {
    const [jobId, ruleId, score, actual, passed, execTime, feedback, isAi] = params;
    const newId = mockGradingResults.length + 1;
    const newRes: MockGradingResult = {
      grading_result_id: newId,
      grading_job_id: Number(jobId),
      rubric_rule_id: Number(ruleId),
      score: parseFloat(score),
      actual_output: actual || '',
      passed: Boolean(passed),
      execution_time_ms: parseInt(execTime, 10) || 0,
      ai_feedback: feedback || null,
      is_ai_generated: Boolean(isAi),
      graded_at: new Date(),
    };
    mockGradingResults.push(newRes);
    return { rows: [newRes] };
  }

  // Grading results: SELECT FROM grading_results
  if (/FROM grading_results/i.test(cleanSql)) {
    let jobId: number | null = null;
    const match = cleanSql.match(/grading_job_id\s*=\s*(\d+|\$1)/i);
    if (match) {
      if (match[1] === '$1' && params && params.length > 0) {
        jobId = Number(params[0]);
      } else {
        jobId = Number(match[1]);
      }
    }
    const results = jobId !== null
      ? mockGradingResults.filter((r) => r.grading_job_id === jobId)
      : mockGradingResults;
    return { rows: results };
  }

  return { rows: [] };
}

const originalQuery = realPool.query.bind(realPool);
const originalConnect = realPool.connect.bind(realPool);

let lastPostgresCheck = 0;

const createMockClient = () => {
  const client: any = new EventEmitter();
  client.query = (text: any, paramsOrCallback?: any, callback?: any): any => {
    const cb = typeof paramsOrCallback === 'function' ? paramsOrCallback : callback;
    const params = typeof paramsOrCallback === 'function' ? [] : (paramsOrCallback || []);
    const p = Promise.resolve().then(() => executeMockQuery(text, params));
    if (typeof cb === 'function') {
      p.then((res: any) => cb(null, res)).catch((err: any) => cb(err));
    }
    return p;
  };
  client.release = () => {};
  return client;
};

const resilientQuery = (sqlText: any, paramsOrCallback?: any, callback?: any): any => {
  const cb = typeof paramsOrCallback === 'function' ? paramsOrCallback : callback;
  const params = typeof paramsOrCallback === 'function' ? [] : (paramsOrCallback || []);

  const run = async (): Promise<any> => {
    if (typeof sqlText !== 'string') {
      return executeMockQuery('', []);
    }

    // If postgres was marked unavailable, periodically try to reconnect
    if (!isPostgresAvailable && Date.now() - lastPostgresCheck < 3000) {
      return executeMockQuery(sqlText, params);
    }

    try {
      const result = await (originalQuery as any)(sqlText, params);
      if (!isPostgresAvailable) {
        console.log('✅ PostgreSQL connection restored.');
        isPostgresAvailable = true;
      }
      return result;
    } catch (err: any) {
      if (
        err.code === 'ECONNREFUSED' ||
        err.code === 'ETIMEDOUT' ||
        err.code === 'ENOTFOUND' ||
        err.name === 'AggregateError' ||
        err.message?.includes('ECONNREFUSED') ||
        err.message?.includes('connect ECONNREFUSED')
      ) {
        lastPostgresCheck = Date.now();
        if (isPostgresAvailable) {
          console.warn('⚠️  PostgreSQL connection unavailable. Seamlessly running in Fallback In-Memory Mode with Seed Data.');
          isPostgresAvailable = false;
        }
        return executeMockQuery(sqlText, params);
      }
      throw err;
    }
  };

  const p = run();
  if (typeof cb === 'function') {
    p.then((res: any) => cb(null, res)).catch((err: any) => cb(err));
  }
  return p;
};

const resilientConnect = (callback?: any): any => {
  const run = async (): Promise<any> => {
    if (!isPostgresAvailable && Date.now() - lastPostgresCheck < 3000) {
      return createMockClient();
    }

    try {
      const client = await originalConnect();
      return client;
    } catch (err: any) {
      if (
        err.code === 'ECONNREFUSED' ||
        err.code === 'ETIMEDOUT' ||
        err.code === 'ENOTFOUND' ||
        err.name === 'AggregateError' ||
        err.message?.includes('ECONNREFUSED') ||
        err.message?.includes('connect ECONNREFUSED')
      ) {
        lastPostgresCheck = Date.now();
        if (isPostgresAvailable) {
          console.warn('⚠️  PostgreSQL connection unavailable. Seamlessly running in Fallback In-Memory Mode with Seed Data.');
          isPostgresAvailable = false;
        }
        return createMockClient();
      }
      throw err;
    }
  };

  if (typeof callback === 'function') {
    run()
      .then((client: any) => callback(null, client, client.release || (() => {})))
      .catch((err: any) => callback(err));
    return;
  }
  return run();
};

(realPool as any).query = resilientQuery;
(realPool as any).connect = resilientConnect;

export const pool = realPool;


