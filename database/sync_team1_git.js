const { execSync } = require('child_process');
const { Pool } = require('../server/node_modules/pg');

const pool = new Pool({
  connectionString: 'postgresql://aita_user:aita_password_123@localhost:5432/aita_db',
});

const NOISE_DIRECTORIES = [
  /(?:^|\/)(?:node_modules|vendor|\.next|\.git|coverage)(?:\/|$)/i,
];
const BUILD_DIRECTORIES = /(^|\/)(dist|build|out)(?=\/|$)/gi;
const SOURCE_PARENT_DIRS = new Set([
  'src', 'app', 'lib', 'modules', 'components', 'pages', 'services',
  'test', 'tests', '__tests__', 'spec', 'source', 'sources',
]);
const NOISE_PATTERNS = [
  /(?:^|\/)(?:package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb|\.DS_Store)$/i,
  /(?:^|\/)\.env(?:\.[\w-]+)?$/i,
  /(?:^|\/)(?:tsconfig(?:\.[\w-]+)*|vite\.config|tailwind\.config|next\.config|postcss\.config|webpack\.config|jest\.config|babel\.config|eslint\.config|vitest\.config|nuxt\.config|svelte\.config)\.[a-z0-9]+$/i,
  /(?:^|\/)\.(?:eslintrc|prettierrc|eslintignore|prettierignore|editorconfig|babelrc|stylelintrc)(?:\.[a-z0-9]+)?$/i,
  /\.min\.(?:js|mjs|cjs|css)$/i,
  /\.map$/i,
  /\.(?:png|jpe?g|gif|bmp|svg|ico|webp|avif|woff2?|ttf|eot|otf|mp4|webm|mp3|pdf)$/i,
];

function isNoiseFile(filename) {
  if (!filename) return false;
  const normalized = filename.replace(/\\/g, '/');
  if (NOISE_DIRECTORIES.some((p) => p.test(normalized))) return true;
  BUILD_DIRECTORIES.lastIndex = 0;
  let match;
  while ((match = BUILD_DIRECTORIES.exec(normalized)) !== null) {
    const parents = normalized.slice(0, match.index).split('/').filter(Boolean);
    const parent = parents[parents.length - 1];
    if (!parent || !SOURCE_PARENT_DIRS.has(parent.toLowerCase())) return true;
  }
  return NOISE_PATTERNS.some((p) => p.test(normalized));
}

function isSourceCodeFile(filename) {
  return !isNoiseFile(filename) && /\.(?:ts|tsx|js|jsx|mjs|cjs|py|java|sql|html|css|scss|c|h|cpp|hpp|cs|go|rs|php|vue|md)$/i.test(filename);
}

// User mapping for Group 4 (SWD392):
// user_id 7: Lê Nguyễn Ánh Mai (lenguyenlinhnhi2110@gmail.com)
// user_id 8: Nguyễn Tường Vy (vyntqe180099@fpt.edu.vn)
// user_id 9: Đỗ Trần Đăng Khoa (dotrandangkhoa17@gmail.com)
// user_id 10: Nguyễn Quốc Thanh Phong (tfongcs05@gmail.com)
// user_id 11: Đinh Gia Huy (dinhgiahuylol12345@gmail.com)

function mapCommitterToUserId(authorName, authorEmail, commitMsg) {
  const an = (authorName || '').toLowerCase();
  const ae = (authorEmail || '').toLowerCase();
  const msg = (commitMsg || '').toLowerCase();

  // Huy (Git Analytics & Peer Audit - Member 4)
  if (an === 'huy' || an.includes('dinhgiahuy') || ae.includes('dinhgiahuy') || ae.includes('dinhgiahuylol12345') || msg.includes('member4') || msg.includes('peer audit') || msg.includes('git-analytics')) {
    return 11;
  }

  // Khoa (AI Tutor & Socratic Engine - Member 3)
  if (an.includes('khoa') || ae.includes('khoa') || an.includes('dotrandang') || ae.includes('dotrandang') || msg.includes('member3') || msg.includes('ai-tutor') || msg.includes('socratic')) {
    return 9;
  }

  // Phong (Frontend UI/UX - Member 5)
  if (an.includes('thanhfong') || ae.includes('thanhfong') || ae.includes('tfong') || an.includes('thanh phong') || msg.includes('member5')) {
    return 10;
  }

  // Vy (Docker Sandbox & Grading Queue - Member 2)
  if (an.includes('gi098') || ae.includes('gi098') || ae.includes('tuongvy') || an.includes('tuongvy') || an.includes('vynt') || ae.includes('vynt') || msg.includes('ai_logs_vy') || msg.includes('[tv2]')) {
    return 8;
  }

  // Mai (Software Architecture, Core Auth & Teams - Member 1)
  if (an.includes('lenguyenanhmai') || ae.includes('lenguyenanhmai') || an.includes('min098') || ae.includes('min098') || an.includes('anhmai') || an.includes('linhnhi') || msg.includes('member1')) {
    return 7;
  }

  return 7; // Default to Mai (team leader) if unidentified
}

async function run() {
  const log = execSync('git log --format="COMMIT_SEP%h|%H|%an|%ae|%ad|%s" --date=iso --numstat', {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
  });

  const rawCommits = log.split('COMMIT_SEP').filter(Boolean);
  console.log(`Found ${rawCommits.length} commits in local git repository.`);

  const commitsToInsert = [];

  for (const raw of rawCommits) {
    const lines = raw.trim().split('\n');
    const header = lines[0];
    const [shortHash, hash, an, ae, ad, ...msgParts] = header.split('|');
    const msg = msgParts.join('|');
    const committedAt = new Date(ad);

    let linesAdded = 0;
    let linesDeleted = 0;

    for (let i = 1; i < lines.length; i++) {
      const statLine = lines[i].trim();
      if (!statLine) continue;
      const parts = statLine.split(/\s+/);
      if (parts.length >= 3) {
        const a = parseInt(parts[0], 10) || 0;
        const d = parseInt(parts[1], 10) || 0;
        const file = parts.slice(2).join(' ');
        if (isSourceCodeFile(file)) {
          linesAdded += a;
          linesDeleted += d;
        }
      }
    }

    const userId = mapCommitterToUserId(an, ae, msg);
    commitsToInsert.push({
      hash,
      msg: (msg || 'Commit from git').substring(0, 255),
      userId,
      linesAdded,
      linesDeleted,
      committedAt,
    });
  }

  console.log(`Inserting/Updating ${commitsToInsert.length} commits for team 1 into PostgreSQL...`);

  // Upsert commits
  let count = 0;
  for (const c of commitsToInsert) {
    await pool.query(
      `INSERT INTO git_commits (team_id, author_user_id, commit_hash, commit_message, lines_added, lines_deleted, committed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (commit_hash) DO UPDATE SET
         team_id = EXCLUDED.team_id,
         author_user_id = EXCLUDED.author_user_id,
         lines_added = EXCLUDED.lines_added,
         lines_deleted = EXCLUDED.lines_deleted,
         commit_message = EXCLUDED.commit_message,
         committed_at = EXCLUDED.committed_at`,
      [1, c.userId, c.hash, c.msg, c.linesAdded, c.linesDeleted, c.committedAt]
    );
    count++;
  }

  console.log(`Successfully upserted ${count} commits.`);

  // Verify aggregated member stats for Team 1
  const statsRes = await pool.query(`
    SELECT 
      u.user_id,
      u.full_name,
      u.email,
      tm.assigned_module,
      COUNT(c.commit_id)::int as total_commits,
      COALESCE(SUM(c.lines_added), 0)::int as total_lines_added,
      COALESCE(SUM(c.lines_deleted), 0)::int as total_lines_deleted
    FROM team_members tm
    JOIN users u ON tm.user_id = u.user_id
    LEFT JOIN git_commits c ON c.author_user_id = u.user_id AND c.team_id = tm.team_id
    WHERE tm.team_id = 1
    GROUP BY u.user_id, u.full_name, u.email, tm.assigned_module
    ORDER BY total_commits DESC
  `);

  console.log('\n=== TEAM 1 (SWD392) TELEMETRY SUMMARY ===');
  console.table(statsRes.rows);

  const teamTotalLinesAdded = statsRes.rows.reduce((sum, m) => sum + Number(m.total_lines_added), 0);
  const teamTotalCommits = statsRes.rows.reduce((sum, m) => sum + Number(m.total_commits), 0);

  console.log(`\nTeam Total Commits: ${teamTotalCommits}`);
  console.log(`Team Total LOC Added: ${teamTotalLinesAdded}`);

  for (const m of statsRes.rows) {
    const pct = teamTotalLinesAdded > 0 ? ((Number(m.total_lines_added) / teamTotalLinesAdded) * 100).toFixed(1) : 0;
    const isFreeRider = Number(pct) < 5.0 || Number(m.total_commits) === 0;
    console.log(`- ${m.full_name}: ${m.total_commits} commits | +${m.total_lines_added} / -${m.total_lines_deleted} LOC | ${pct}% | Status: ${isFreeRider ? 'FREE_RIDER_WARNING' : 'NORMAL'}`);
  }

  await pool.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
