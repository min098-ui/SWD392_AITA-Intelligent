/**
 * Unit test riêng cho Noise Filter (BR-07).
 * Chạy: npm run test:noise-filter
 * Không cần database/Redis — chỉ kiểm tra logic thuần.
 */
import {
  NOISE_PATTERNS,
  isNoiseFile,
  isSourceCodeFile,
  parseGitHubUrl,
} from '../modules/git-analytics/noise-filter.service';

let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(name: string, actual: boolean, expected: boolean): void {
  if (actual === expected) {
    passed++;
    console.log(`  ✅ PASS: ${name}`);
  } else {
    failed++;
    failures.push(`${name} (expected ${expected}, got ${actual})`);
    console.log(`  ❌ FAIL: ${name} → expected ${expected}, got ${actual}`);
  }
}

console.log('\n🧪 NOISE FILTER UNIT TESTS (BR-07)\n');
console.log(`Số pattern đang cấu hình: ${NOISE_PATTERNS.length}`);
console.log(`Số đuôi mã nguồn được tính LOC: .ts .tsx .js .jsx .mjs .cjs .py .java .sql .html .css .scss .c .h .cpp .hpp .cs .go .rs .php .vue\n`);

// ---------------------------------------------------------------------------
// 1. File nhiễu (KHÔNG được tính LOC)
// ---------------------------------------------------------------------------
console.log('— Nhóm 1: file nhiễu phải bị lọc (isNoiseFile = true) —');
const noiseCases: Array<[string, string]> = [
  ['Lockfile npm', 'package-lock.json'],
  ['Lockfile yarn', 'yarn.lock'],
  ['Lockfile pnpm', 'pnpm-lock.yaml'],
  ['Lockfile bun', 'bun.lockb'],
  ['Thư mục dist', 'dist/app.js'],
  ['Thư mục build', 'build/main.js'],
  ['node_modules', 'node_modules/react/index.js'],
  ['Next.js .next', '.next/static/chunks/page.js'],
  ['coverage', 'coverage/lcov.info'],
  ['Source map', 'bundle.js.map'],
  ['Bundle minify', 'app.min.js'],
  ['Ảnh PNG', 'assets/logo.png'],
  ['Ảnh JPG', 'public/hero.jpg'],
  ['Ảnh SVG', 'icons/user.svg'],
  ['Icon ICO', 'favicon.ico'],
  ['Ảnh WEBP', 'images/banner.webp'],
  ['Font WOFF2', 'fonts/Inter.woff2'],
  ['ESLint config', '.eslintrc.json'],
  ['Prettier config', '.prettierrc'],
  ['TypeScript config', 'tsconfig.json'],
  ['Vite config', 'vite.config.ts'],
  ['Tailwind config', 'tailwind.config.js'],
  ['Biến môi trường', '.env'],
  ['macOS metadata', '.DS_Store'],
  ['Đường dẫn Windows', 'C:\\project\\node_modules\\express\\index.js'],
  ['Đường dẫn Windows dist', 'C:\\project\\dist\\app.js'],
];
for (const [label, file] of noiseCases) check(`${label}: ${file}`, isNoiseFile(file), true);

// ---------------------------------------------------------------------------
// 2. File mã nguồn (ĐƯỢC tính LOC)
// ---------------------------------------------------------------------------
console.log('\n— Nhóm 2: file mã nguồn phải được giữ lại (isSourceCodeFile = true) —');
const sourceCases: Array<[string, string]> = [
  ['TypeScript service', 'src/modules/auth/auth.service.ts'],
  ['TSX component', 'client/src/app/page.tsx'],
  ['JavaScript', 'server/src/index.js'],
  ['JSX component', 'client/src/components/Modal.jsx'],
  ['Python', 'sandbox/main.py'],
  ['Java', 'src/main/java/User.java'],
  ['C', 'native/engine.c'],
  ['C++', 'native/runner.cpp'],
  ['C header', 'native/engine.h'],
  ['C#', 'dotnet/Program.cs'],
  ['Go', 'cmd/server/main.go'],
  ['Rust', 'src/lib.rs'],
  ['PHP', 'public/index.php'],
  ['Vue SFC', 'client/src/App.vue'],
  ['SQL', 'database/schema.sql'],
  ['HTML', 'client/public/index.html'],
  ['CSS', 'client/src/app/globals.css'],
  ['Đường dẫn Windows TS', 'D:\\SWD\\project\\src\\modules\\git-analytics\\git.routes.ts'],
];
for (const [label, file] of sourceCases) check(`${label}: ${file}`, isSourceCodeFile(file), true);

// ---------------------------------------------------------------------------
// 3. File mã nguồn không được coi là nhiễu
// ---------------------------------------------------------------------------
console.log('\n— Nhóm 3: file code không bị nhận nhầm là nhiễu —');
const notNoise: string[] = [
  'src/modules/git-analytics/git.routes.ts',
  'client/src/app/layout.tsx',
  'database/seed.sql',
  '.gitignore', // file cấu hình git, không phải thư mục .git
];
for (const file of notNoise) check(`Không phải nhiễu: ${file}`, isNoiseFile(file), false);

// ---------------------------------------------------------------------------
// 4. File cấu hình / asset không được coi là mã nguồn
// ---------------------------------------------------------------------------
console.log('\n— Nhóm 4: config & asset không được tính là mã nguồn —');
const notSource: string[] = [
  'tsconfig.build.json',
  'vite.config.ts',
  'assets/banner.png',
  'package-lock.json',
  'src/app.min.js',
];
for (const file of notSource) check(`Không phải source: ${file}`, isSourceCodeFile(file), false);

// ---------------------------------------------------------------------------
// 5. parseGitHubUrl
// ---------------------------------------------------------------------------
console.log('\n— Nhóm 5: parseGitHubUrl() —');
const httpsParsed = parseGitHubUrl('https://github.com/min098-ui/SWD392_AITA-Intelligent.git');
check('HTTPS URL: đọc được owner', httpsParsed?.owner === 'min098-ui', true);
check('HTTPS URL: đọc được repo', httpsParsed?.repo === 'SWD392_AITA-Intelligent', true);

const sshParsed = parseGitHubUrl('git@github.com:min098-ui/SWD392_AITA-Intelligent.git');
check('SSH URL: đọc được owner', sshParsed?.owner === 'min098-ui', true);
check('SSH URL: đọc được repo', sshParsed?.repo === 'SWD392_AITA-Intelligent', true);

const plainParsed = parseGitHubUrl('https://github.com/octocat/Hello-World');
check('URL không có .git vẫn parse được', plainParsed?.repo === 'Hello-World', true);

check('URL GitLab bị từ chối', parseGitHubUrl('https://gitlab.com/a/b.git') === null, true);
check('Chuỗi rỗng bị từ chối', parseGitHubUrl('') === null, true);
check('Giá trị không phải string bị từ chối', parseGitHubUrl(null as unknown as string) === null, true);

// ---------------------------------------------------------------------------
// Tổng kết
// ---------------------------------------------------------------------------
const total = passed + failed;
console.log('\n──────────────────────────────────────────────');
console.log(`🏁 KẾT QUẢ: ${passed}/${total} PASS — ${failed} FAIL`);
if (failed > 0) {
  console.log('\n❌ Các case thất bại:');
  failures.forEach((f) => console.log('   - ' + f));
  process.exitCode = 1;
} else {
  console.log('✅ Noise Filter hoạt động đúng: lọc sạch config/asset/lockfile, giữ đúng mã nguồn.');
  process.exitCode = 0;
}
console.log('');
