export const NOISE_PATTERNS: RegExp[] = [
  // Thư mục sinh ra khi cài dependency / build
  /(?:^|[\\/])(?:node_modules|dist|build|\.next|out|coverage|\.git)[\\/]/i,
  // Lockfile & file môi trường
  /(?:^|[\\/])(?:package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb|\.env|\.env\.local|\.DS_Store)$/i,
  // File cấu hình công cụ (không phải mã nghiệp vụ)
  /(?:^|[\\/])(?:tsconfig(?:\.[\w-]+)*|vite\.config|tailwind\.config|next\.config|postcss\.config|webpack\.config|jest\.config|babel\.config|eslint\.config|vitest\.config|nuxt\.config|svelte\.config)\.[a-z0-9]+$/i,
  /(?:^|[\\/])\.(?:eslintrc|prettierrc|eslintignore|prettierignore|editorconfig|babelrc|stylelintrc)(?:\.[a-z0-9]+)?$/i,
  // Bundle/minify & source map
  /\.min\.(?:js|css)$/i,
  /\.map$/i,
  // Assets: ảnh, icon, font, media
  /\.(?:png|jpe?g|gif|bmp|svg|ico|webp|avif|woff2?|ttf|eot|otf|mp4|webm|mp3|pdf)$/i,
];
export function isNoiseFile(filename: string): boolean {
  return NOISE_PATTERNS.some(pattern => pattern.test(filename));
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
