/**
 * Bộ lọc nhiễu cho thống kê LOC từ GitHub (BR-07).
 *
 * Nguyên tắc:
 * - Thư mục sinh tự động (node_modules, vendor, .next, .git, coverage) luôn bị loại.
 * - Thư mục output (dist, build, out) bị loại, TRỪ KHI nằm ngay dưới một thư mục
 *   mã nguồn thật (src/, app/, lib/...) — ví dụ src/build/Builder.java vẫn là code.
 * - File cấu hình, lockfile, asset, bundle minify không được tính LOC.
 */

// Thư mục luôn là nhiễu, xuất hiện ở bất kỳ độ sâu nào
export const NOISE_DIRECTORIES = [
  /(?:^|\/)(?:node_modules|vendor|\.next|\.git|coverage)(?:\/|$)/i,
];

// Thư mục build/output: chỉ là nhiễu khi không nằm trong thư mục mã nguồn
const BUILD_DIRECTORIES = /(^|\/)(dist|build|out)(?=\/|$)/gi;
const SOURCE_PARENT_DIRS = new Set([
  'src', 'app', 'lib', 'modules', 'components', 'pages', 'services',
  'test', 'tests', '__tests__', 'spec', 'source', 'sources',
]);

// File nhiễu theo tên/đuôi
export const NOISE_PATTERNS: RegExp[] = [
  // Lockfile & file môi trường
  /(?:^|\/)(?:package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb|\.DS_Store)$/i,
  /(?:^|\/)\.env(?:\.[\w-]+)?$/i,
  // File cấu hình công cụ (không phải mã nghiệp vụ)
  /(?:^|\/)(?:tsconfig(?:\.[\w-]+)*|vite\.config|tailwind\.config|next\.config|postcss\.config|webpack\.config|jest\.config|babel\.config|eslint\.config|vitest\.config|nuxt\.config|svelte\.config)\.[a-z0-9]+$/i,
  /(?:^|\/)\.(?:eslintrc|prettierrc|eslintignore|prettierignore|editorconfig|babelrc|stylelintrc)(?:\.[a-z0-9]+)?$/i,
  // Bundle/minify & source map
  /\.min\.(?:js|mjs|cjs|css)$/i,
  /\.map$/i,
  // Assets: ảnh, icon, font, media
  /\.(?:png|jpe?g|gif|bmp|svg|ico|webp|avif|woff2?|ttf|eot|otf|mp4|webm|mp3|pdf)$/i,
];

export function isNoiseFile(filename: string): boolean {
  if (typeof filename !== 'string' || filename.length === 0) return false;

  const normalized = filename.replace(/\\/g, '/');

  if (NOISE_DIRECTORIES.some((pattern) => pattern.test(normalized))) return true;

  BUILD_DIRECTORIES.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = BUILD_DIRECTORIES.exec(normalized)) !== null) {
    const parents = normalized.slice(0, match.index).split('/').filter(Boolean);
    const parent = parents[parents.length - 1];
    if (!parent || !SOURCE_PARENT_DIRS.has(parent.toLowerCase())) return true;
  }

  return NOISE_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function isSourceCodeFile(filename: string): boolean {
  return !isNoiseFile(filename) && /\.(?:ts|tsx|js|jsx|mjs|cjs|py|java|sql|html|css|scss|c|h|cpp|hpp|cs|go|rs|php|vue)$/i.test(filename);
}

export function parseGitHubUrl(repoUrl: string): { owner: string; repo: string } | null {
  if (typeof repoUrl !== 'string') return null;
  const match = repoUrl.trim().match(/^(?:https:\/\/github\.com\/|git@github\.com:)([a-z0-9-]+)\/([a-z0-9_.-]+?)(?:\.git)?\/?$/i);
  if (!match || match[2] === '.' || match[2] === '..') return null;
  return { owner: match[1], repo: match[2] };
}
