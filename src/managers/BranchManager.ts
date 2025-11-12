/**
 * /managers/BranchManager.ts
 * -------------------------------------------------------------
 * Interactive Branch Manager for plain-git CLI.
 *
 * Responsibilities:
 * - createBranch (create only)
 * - createAndSwitch (create + checkout)
 * - switchBranch (checkout / switch)
 * - deleteBranch (safe or force)
 * - renameBranch
 * - listBranches (print)
 * - showCurrentBranch (print)
 * - pushBranch (push -u origin <branch>)
 *
 * Notes:
 * - Uses GitExecutor.run(...) to execute commands and show output.
 * - Uses execSync for quick read-only queries (to build interactive lists).
 * -------------------------------------------------------------
 */

import inquirer from 'inquirer';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { GitExecutor } from '../core/GitExecutor';
import { Logger } from '../utils/Logger';

/**
 * Helper: returns an array of branch names (local first, then remote names)
 */
function getBranchList(): string[] {
  try {
    // include both local and remote branches for selection
    const raw = execSync('git branch --all --no-color', { encoding: 'utf-8' });
    const lines = raw
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const branches = lines.map((l) => {
      // remove leading '*' for current branch, remove "remotes/" prefix
      const cleaned = l.replace(/^\*\s*/, '').replace(/^remotes\//, '');
      return cleaned;
    });

    // dedupe and filter HEAD pointers
    const unique = Array.from(new Set(branches)).filter((b) => !b.includes('HEAD ->'));
    return unique;
  } catch (err) {
    return [];
  }
}

/**
 * Helper: get current branch name or null if not a repo / detached
 */
function getCurrentBranchName(): string | null {
  try {
    const out = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    return out || null;
  } catch {
    return null;
  }
}

export const BranchManager = {
  /**
   * Create a new branch (does not switch to it)
   */
  async createBranch() {
    const { name } = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Enter new branch name:',
        validate: (v) => (v ? true : 'Name required'),
      },
    ]);

    Logger.info(`🌱 Creating branch '${name}'...`);
    await GitExecutor.run(`git branch ${name}`);
    Logger.success(`✅ Branch '${name}' created.`);
  },

  /**
   * Create and switch to the new branch (git checkout -b or git switch -c)
   */
  async createAndSwitch() {
    const { name } = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Enter new branch name to create and switch to:',
        validate: (v) => (v ? true : 'Name required'),
      },
    ]);

    Logger.info(`🌱 Creating and switching to branch '${name}'...`);
    // prefer 'git switch -c' when available, but fallback to checkout -b
    await GitExecutor.run(`git switch -c ${name} 2>/dev/null || git checkout -b ${name}`);
    Logger.success(`✅ Now on branch '${name}'.`);
  },

  /**
   * Switch to an existing branch (interactive list)
   */
  async switchBranch() {
    const branches = getBranchList();
    if (!branches.length) {
      Logger.info('⚠️ No branches found or not a git repository.');
      return;
    }

    const { branch } = await inquirer.prompt([
      { type: 'list', name: 'branch', message: 'Select branch to switch to:', choices: branches },
    ]);

    Logger.info(`🔄 Switching to branch '${branch}'...`);
    await GitExecutor.run(`git switch ${branch} 2>/dev/null || git checkout ${branch}`);
    Logger.success(`✅ Switched to '${branch}'.`);
  },

  /**
   * Delete a branch (interactive + confirm). Supports force delete option.
   */
  async deleteBranch() {
    const branches = getBranchList().filter((b) => !b.startsWith('remotes/'));
    if (!branches.length) {
      Logger.info('⚠️ No local branches found or not a git repository.');
      return;
    }

    const { branch } = await inquirer.prompt([
      {
        type: 'list',
        name: 'branch',
        message: 'Select local branch to delete:',
        choices: branches,
      },
    ]);

    const { force } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'force',
        message: `Force delete '${branch}'? (use -D)`,
        default: false,
      },
    ]);

    const cmd = force ? `git branch -D ${branch}` : `git branch -d ${branch}`;
    Logger.info(`🗑️ Deleting branch '${branch}' (${force ? 'force' : 'safe'})...`);
    await GitExecutor.run(cmd);
    Logger.success(`✅ Branch '${branch}' deleted.`);
  },

  /**
   * Rename current or chosen branch
   */
  async renameBranch() {
    const branches = getBranchList().filter((b) => !b.startsWith('remotes/'));
    if (!branches.length) {
      Logger.info('⚠️ No local branches found or not a git repository.');
      return;
    }

    const { branch } = await inquirer.prompt([
      {
        type: 'list',
        name: 'branch',
        message: 'Select local branch to rename:',
        choices: branches,
      },
    ]);

    const { newName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'newName',
        message: `Enter new name for '${branch}':`,
        validate: (v) => (v ? true : 'Name required'),
      },
    ]);

    // If renaming current branch, use git branch -m <old> <new> works either way
    Logger.info(`✏️ Renaming branch '${branch}' -> '${newName}'...`);
    await GitExecutor.run(`git branch -m ${branch} ${newName}`);
    Logger.success(`✅ Branch renamed to '${newName}'.`);
  },

  /**
   * Print a list of branches (delegates to git branch --all)
   */
  async listBranches() {
    Logger.info('📋 Listing branches...');
    await GitExecutor.run('git branch --all --verbose --no-color');
  },

  /**
   * Show current branch name
   */
  async showCurrentBranch() {
    const cur = getCurrentBranchName();
    if (cur) {
      Logger.info(`📍 Current branch: ${chalk.bold(cur)}`);
    } else {
      Logger.info('📍 Not inside a git repository or in detached HEAD.');
    }
  },

  /**
   * Push a branch to origin and set upstream (interactive)
   */
  async pushBranch() {
    const branches = getBranchList().filter((b) => !b.startsWith('remotes/'));
    if (!branches.length) {
      Logger.info('⚠️ No local branches found or not a git repository.');
      return;
    }

    const { branch } = await inquirer.prompt([
      {
        type: 'list',
        name: 'branch',
        message: 'Select branch to push (set upstream):',
        choices: branches,
      },
    ]);

    const { remote } = await inquirer.prompt([
      {
        type: 'input',
        name: 'remote',
        message: 'Remote name (default: origin):',
        default: 'origin',
      },
    ]);

    Logger.info(`🚀 Pushing '${branch}' to '${remote}' and setting upstream...`);
    await GitExecutor.run(`git push -u ${remote} ${branch}`);
    Logger.success(`✅ Branch '${branch}' pushed to ${remote}.`);
  },

  /**
   * Convenience: show current and then list branches
   */
  async showAndList() {
    await this.showCurrentBranch();
    await this.listBranches();
  },
};
