import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export function createTestRepo() {
  const repoPath = path.join(process.cwd(), 'tests', 'sandbox', 'repo');

  if (fs.existsSync(repoPath)) {
    fs.rmSync(repoPath, { recursive: true, force: true });
  }

  fs.mkdirSync(repoPath, { recursive: true });

  execSync('git init', { cwd: repoPath });
  return repoPath;
}
