export const NOISE_PATTERNS: RegExp[] = [
  /(?:^|[\\/])(?:node_modules|dist|build|\.next|coverage|\.git)[\\/]/i,
  /(?:^|[\\/])(?:package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb|\.env|\.env\.local|\.DS_Store)$/i,
  /\.min\.(?:js|css)$/i,
  /\.map$/i,
];
export function isNoiseFile(filename: string): boolean {
  return NOISE_PATTERNS.some(pattern => pattern.test(filename));
}
export function isSourceCodeFile(filename: string): boolean {
  return !isNoiseFile(filename) && /\.(?:ts|tsx|js|jsx|py|java|sql|html|css)$/i.test(filename);
}
export function parseGitHubUrl(repoUrl: string): { owner: string; repo: string } | null {
  if (typeof repoUrl !== 'string') return null;
  const match = repoUrl.trim().match(/^(?:https:\/\/github\.com\/|git@github\.com:)([a-z0-9-]+)\/([a-z0-9_.-]+?)(?:\.git)?\/?$/i);
  if (!match || match[2] === '.' || match[2] === '..') return null;
  return { owner: match[1], repo: match[2] };
}
