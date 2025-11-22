/**
 * 🔀 MergeManager.ts
 * -------------------------------------------------------------
 * Handles merging branches with full conflict detection,
 * merge state checks, abort, continue and safe flows.
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
 * Detect if a merge is in progress
 * Git uses the file `.git/MERGE_HEAD` to indicate merge state.
 */
function isMergeInProgress(): boolean {
  return fs.existsSync(path.join(process.cwd(), '.git', 'MERGE_HEAD'));
}

/**
 * List all conflicting (unmerged) files
 */
function getConflictedFiles(): string[] {
  try {
    const output = (execSync('git diff --name-only --diff-filter=U', {
      encoding: 'utf-8',
    }) as unknown as string) ?? '';
    return String(output).split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

export const MergeManager = {
  /**
   * 🔀 Merge another branch into the current branch
   */
  async mergeBranch() {
    // Prevent merging if another merge is still active
    if (isMergeInProgress()) {
      Logger.error('⚠️ Cannot start a new merge while another merge is in progress.');
      Logger.info('Resolve conflicts or abort the merge first.');
      return;
    }

    Logger.info('🔍 Fetching branch list...');

    const branchListRaw = (execSync('git branch --all', { encoding: 'utf-8' }) as unknown as string) ?? '';
    const branchesOutput = String(branchListRaw)
      .split('\n')
      .map((b) => b.replace('*', '').trim())
      .filter(Boolean)
      .filter((b) => !b.includes('HEAD'));

    if (branchesOutput.length === 0) {
      Logger.info('ℹ️ No branches available for merging.');
      return;
    }

    const { target } = await inquirer.prompt([
      {
        type: 'list',
        name: 'target',
        message: 'Select a branch to merge into the current branch:',
        choices: branchesOutput,
      },
    ]);

    Logger.info(`🔀 Merging branch '${target}'...`);
    await GitExecutor.run(`git merge ${target}`);

    const conflicts = getConflictedFiles();

    if (conflicts.length > 0) {
      Logger.error('\n⚠️ Merge conflicts detected!');
      conflicts.forEach((file) => console.log(chalk.red(`  - ${file}`)));

      console.log(
        chalk.yellow(
          '\nResolve conflicts manually, then run:\n' +
            '  git add <file>\n' +
            '  git merge --continue\n',
        ),
      );
      return;
    }

    Logger.success('✅ Merge completed successfully!');
  },

  /**
   * 📁 Show conflicting files
   */
  async showConflicts() {
    const conflicts = getConflictedFiles();

    if (!conflicts.length) {
      Logger.success('🎉 No merge conflicts detected.');
      return;
    }

    Logger.error('⚠️ Files with merge conflicts:');
    conflicts.forEach((file) => console.log(chalk.red(`  - ${file}`)));
  },

  /**
   * 🛑 Abort the active merge
   */
  async abortMerge() {
    if (!isMergeInProgress()) {
      Logger.info('ℹ️ No active merge to abort.');
      return;
    }

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to abort the merge?',
        default: false,
      },
    ]);

    if (!confirm) {
      Logger.info('❎ Merge abort cancelled.');
      return;
    }

    Logger.info('🛑 Aborting merge...');
    await GitExecutor.run('git merge --abort');
    Logger.success('🚫 Merge aborted successfully.');
  },

  /**
   * ▶️ Continue merge after resolving conflicts
   */
  async continueMerge() {
    if (!isMergeInProgress()) {
      Logger.info('ℹ️ No active merge to continue.');
      return;
    }

    Logger.info('▶️ Continuing merge...');
    await GitExecutor.run('git merge --continue');
    Logger.success('✅ Merge continued successfully!');
  },
};
