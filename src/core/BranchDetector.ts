// core/BranchDetector.ts
import { execSync } from "child_process";

export class BranchDetector {
  static getCurrentBranch(): string | null {
    try {
      const branch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf-8" }).trim();
      return branch || null;
    } catch {
      return null; // Not a git repo or detached HEAD
    }
  }
}
