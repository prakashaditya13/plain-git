import { execFile } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import fs from 'fs';
import { Logger } from '../utils/Logger';
import { GitExecutor } from './GitExecutor';
import inquirer from 'inquirer';

const execFileAsync = promisify(execFile);

/**
 * 🧩 GitDetector Class
 * -------------------------------------------------------------
 * This class is responsible for detecting and validating the Git
 * environment for the Plain-Git CLI. It ensures the user’s system
 * is properly configured before performing Git operations.
 *
 * 🔍 Key Features:
 * 1. Detects if Git is installed and available in PATH (cross-platform).
 * 2. Checks if the current working directory is a valid Git repository.
 * 3. Validates environment configuration (OS, Git path, version, etc.).
 * 4. Provides diagnostic information through structured logging.
 * 5. Uses Logger.warn() to handle non-critical environment warnings.
 *
 * 💡 Typical Usage:
 * const detector = new GitDetector();
 * await detector.checkEnvironment(); // Validate Git & environment setup
 * await detector.detectGitRepository(); // Ensure repo presence
 *
 * -------------------------------------------------------------
 */

export class GitDetector {
  /**
   * Check if Git is installed and available on the current system.
   * Automatically detects across Windows, macOS, and Linux.
   */
  static async isGitAvailable(): Promise<{ available: boolean; path?: string; reason?: string }> {
    // 1️⃣ Try direct command first
    try {
      const { stdout } = await execFileAsync('git', ['--version'], { timeout: 3000 });
      if (stdout && stdout.toLowerCase().includes('git version')) {
        return { available: true };
      }
    } catch {
      // fallback to other checks
    }

    // 2️⃣ Platform-specific lookups
    const platformResult = await this.checkPlatformSpecific();
    if (platformResult.available) return platformResult;

    // 3️⃣ Check common installation paths
    const pathResult = this.checkCommonPaths();
    if (pathResult.available) return pathResult;

    // ❌ Not found
    return {
      available: false,
      reason: 'git not found on PATH or in common installation directories',
    };
  }

  /**
   * Platform-specific fallback to locate git using native shell commands.
   */
  private static async checkPlatformSpecific(): Promise<{ available: boolean; path?: string }> {
    try {
      if (os.platform() === 'win32') {
        const { stdout } = await execFileAsync('where', ['git'], { timeout: 3000 });
        if (stdout && stdout.trim()) {
          return { available: true, path: stdout.split(/\r?\n/)[0].trim() };
        }
      } else {
        // POSIX → try `command -v` and fallback to `which`
        try {
          const { stdout } = await execFileAsync('command', ['-v', 'git'], { timeout: 3000 });
          if (stdout && stdout.trim()) {
            return { available: true, path: stdout.trim() };
          }
        } catch {
          const { stdout } = await execFileAsync('which', ['git'], { timeout: 3000 });
          if (stdout && stdout.trim()) {
            return { available: true, path: stdout.trim() };
          }
        }
      }
    } catch {
      // ignore and continue
    }
    return { available: false };
  }

  /**
   * Checks common Git installation paths for both Windows and Unix systems.
   */
  private static checkCommonPaths(): { available: boolean; path?: string } {
    const candidates =
      os.platform() === 'win32'
        ? [
            'C:\\Program Files\\Git\\cmd\\git.exe',
            'C:\\Program Files\\Git\\bin\\git.exe',
            'C:\\Program Files (x86)\\Git\\cmd\\git.exe',
          ]
        : ['/usr/bin/git', '/usr/local/bin/git', '/opt/homebrew/bin/git'];

    for (const p of candidates) {
      try {
        if (fs.existsSync(p)) {
          return { available: true, path: p };
        }
      } catch {
        // ignore
      }
    }

    return { available: false };
  }

  /**
   * Checks whether the current working directory is a Git repository.
   */
  static isGitRepo(cwd: string = process.cwd()): boolean {
    return fs.existsSync(`${cwd}/.git`);
  }

  /**
   * Performs a full environment validation and guides the user.
   * This would be an optional advanced diagnostic command — for example if you want the user to explicitly run: `plain-git diagnose`
   */
  static async checkEnvironment(): Promise<void> {
    const availability = await this.isGitAvailable();

    if (!availability.available) {
      Logger.error('❌ Git is not installed or not found in your PATH.');
      Logger.info('👉 Please install Git from https://git-scm.com/downloads and try again.\n');
      process.exit(1);
    }

    Logger.success(`✅ Git detected (${availability.path || 'PATH available'})`);

    const inRepo = this.isGitRepo();
    if (inRepo) {
      Logger.success('📁 Current directory is a valid Git repository.\n');
    } else {
      Logger.warn('Git detected, but this folder is not a Git repository.');
      // Logger.info('💡 You can initialize one using: plain-git init\n');
      const { init } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'init',
          message: 'Would you like to initialize a new Git repository here?',
          default: true,
        },
      ]);

      if (init) {
        const success = await GitExecutor.initRepository();
        if (!success) {
          Logger.error('❌ Could not initialize repository. Exiting...');
          process.exit(1);
        }
      } else {
        Logger.info('👋 Exiting plain-git. Run inside a Git repository next time.');
        process.exit(0);
      }
    }
  }

  /**
   * Optional detailed diagnostic output for debugging.
   */
  static async diagnose(): Promise<void> {
    const availability = await this.isGitAvailable();
    console.log('\n🔍 Git Environment Diagnostic:');

    if (!availability.available) {
      console.error('❌ Git not found!');
      console.log('👉 Install Git from https://git-scm.com/downloads and add it to PATH.\n');
      return;
    }

    console.log(`✅ Git found at: ${availability.path || 'PATH available'}`);

    if (this.isGitRepo()) {
      console.log('📂 Current folder is a valid Git repository.');
    } else {
      console.warn('⚠️ Current folder is NOT a Git repository.');
      console.log('💡 You can initialize one with: git init\n');
    }
  }
}
