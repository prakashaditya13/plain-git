/**
 * 🔁 RebaseManager.ts
 * -------------------------------------------------------------
 * Handles rebasing workflows: start, interactive, continue,
 * skip, abort, and conflict detection.
 * Uses .git/REBASE_HEAD to detect rebase state.
 * -------------------------------------------------------------
 */

import inquirer from 'inquirer';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { GitExecutor } from '../core/GitExecutor';
import { Logger } from '../utils/Logger';

/**
 * Detect if a rebase is in progress (.git/REBASE_HEAD)
 */
function isRebaseInProgress(): boolean {
  return fs.existsSync(path.join(process.cwd(), '.git', 'REBASE_HEAD'));
}

/**
 * Get conflicting files during rebase
 */
function getConflictedFiles(): string[] {
  try {
    const output = execSync('git diff --name-only --diff-filter=U', {
      encoding: 'utf-8',
    });
    return output.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

export const RebaseManager = {
  /**
   * 🔁 Start a normal rebase onto another branch
   */
  async startRebase() {
    if (isRebaseInProgress()) {
      Logger.error('⚠️ A rebase is already in progress.');
      return;
    }

    Logger.info('🔍 Fetching branches...');

    const branches = execSync('git branch --all', { encoding: 'utf-8' })
      .split('\n')
      .map((b) => b.replace('*', '').trim())
      .filter(Boolean)
      .filter((b) => !b.includes('HEAD'));

    if (!branches.length) {
      Logger.info('ℹ️ No branches available for rebasing.');
      return;
    }

    const { onto } = await inquirer.prompt([
      {
        type: 'list',
        name: 'onto',
        message: 'Rebase current branch onto:',
        choices: branches,
      },
    ]);

    Logger.info(`🔁 Rebasing onto '${onto}'...`);
    await GitExecutor.run(`git rebase ${onto}`);

    const conflicts = getConflictedFiles();

    if (conflicts.length > 0) {
      Logger.error('⚠️ Conflicts detected!');
      conflicts.forEach((f) => console.log(chalk.red(`  - ${f}`)));
      console.log(chalk.yellow('\nFix conflicts, then run: git rebase --continue'));
      return;
    }

    Logger.success('✅ Rebase completed!');
  },

  /**
   * ✏️ Interactive rebase (pick, squash, reword, etc.)
   */
  async interactiveRebase() {
    const { count } = await inquirer.prompt([
      {
        type: 'input',
        name: 'count',
        message: 'How many commits back to rebase interactively?',
        validate: (v) => (!isNaN(Number(v)) ? true : 'Enter a valid number.'),
      },
    ]);

    Logger.info(`✏️ Starting interactive rebase for last ${count} commits...`);
    await GitExecutor.run(`git rebase -i HEAD~${count}`);
  },

  /**
   * ▶️ Continue rebase after conflicts are resolved
   */
  async continueRebase() {
    if (!isRebaseInProgress()) {
      Logger.info('ℹ️ No active rebase to continue.');
      return;
    }

    Logger.info('▶️ Continuing rebase...');
    await GitExecutor.run('git rebase --continue');
    Logger.success('✅ Rebase continued!');
  },

  /**
   * ⏭ Skip the conflicting commit
   */
  async skipCommit() {
    if (!isRebaseInProgress()) {
      Logger.info('ℹ️ No active rebase to skip.');
      return;
    }

    Logger.info('⏭ Skipping conflicting commit...');
    await GitExecutor.run('git rebase --skip');
    Logger.success('⏭ Commit skipped!');
  },

  /**
   * 🛑 Abort rebase entirely
   */
  async abortRebase() {
    if (!isRebaseInProgress()) {
      Logger.info('ℹ️ No rebase in progress to abort.');
      return;
    }

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Abort rebase?',
        default: false,
      },
    ]);

    if (!confirm) {
      Logger.info('❎ Rebase abort cancelled.');
      return;
    }

    Logger.info('🛑 Aborting rebase...');
    await GitExecutor.run('git rebase --abort');
    Logger.success('🚫 Rebase aborted.');
  },

  /**
   * ⚠️ Show conflicting files during rebase
   */
  async showConflicts() {
    const conflicts = getConflictedFiles();

    if (!conflicts.length) {
      Logger.success('🎉 No conflicts detected.');
      return;
    }

    Logger.error('⚠️ Files with conflicts:');
    conflicts.forEach((f) => console.log(chalk.red(`  - ${f}`)));
  },
};
