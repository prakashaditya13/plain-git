/**
 * 📝 CommitManager.ts
 * -------------------------------------------------------------
 * Handles all commit-related operations such as adding,
 * committing, viewing logs, diffs, and undoing commits.
 * -------------------------------------------------------------
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { GitExecutor } from '../core/GitExecutor';
import { Logger } from '../utils/Logger';   

/**
 * Helper: get list of modified/untracked files
 */
function getModifiedFiles(): string[] {
  try {
    const output = execSync('git status --porcelain', { encoding: 'utf-8' });
    return output
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => l.replace(/^.. /, ''));
  } catch {
    return [];
  }
}

export const CommitManager = {
  /**
   * Stage all files (git add .)
   */
  async stageAll() {
    Logger.info('🧩 Staging all modified and new files...');
    await GitExecutor.run('git add .');
    Logger.success('✅ All files staged successfully!');
  },

  /**
   * Stage specific files interactively
   */
  async stageFiles() {
    const files = getModifiedFiles();
    if (!files.length) {
      Logger.info('⚠️ No modified or untracked files found.');
      return;
    }

    const { selected } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selected',
        message: 'Select files to stage:',
        choices: files,
      },
    ]);

    if (selected.length === 0) {
      Logger.info('No files selected.');
      return;
    }

    const cmd = `git add ${selected.join(' ')}`;
    Logger.info(`🧩 Staging ${selected.length} file(s)...`);
    await GitExecutor.run(cmd);
    Logger.success(`✅ Staged ${selected.length} file(s).`);
  },

  /**
   * Unstage files (git restore --staged)
   */
  async unstageFiles() {
    const files = getModifiedFiles();
    if (!files.length) {
      Logger.info('⚠️ No files to unstage.');
      return;
    }

    const { selected } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selected',
        message: 'Select files to unstage:',
        choices: files,
      },
    ]);

    if (selected.length === 0) {
      Logger.info('No files selected.');
      return;
    }

    const cmd = `git restore --staged ${selected.join(' ')}`;
    Logger.info(`🗑️ Unstaging ${selected.length} file(s)...`);
    await GitExecutor.run(cmd);
    Logger.success(`✅ Unstaged ${selected.length} file(s).`);
  },

  /**
   * Commit staged files with message
   */
  async commitChanges() {
    const { message } = await inquirer.prompt([
      { type: 'input', name: 'message', message: '📝 Enter commit message:' },
    ]);

    if (!message.trim()) {
      Logger.info('⚠️ Commit message cannot be empty.');
      return;
    }

    const cmd = `git commit -m "${message}"`;
    Logger.info('💾 Committing changes...');
    await GitExecutor.run(cmd);
    Logger.success('✅ Commit completed!');
  },

  /**
   * Amend last commit message (fix last commit)
   */
  async amendLastCommit() {
    const { message } = await inquirer.prompt([
      {
        type: 'input',
        name: 'message',
        message: 'Enter new commit message for the last commit:',
      },
    ]);

    const cmd = `git commit --amend -m "${message}"`;
    Logger.info('✏️ Amending last commit...');
    await GitExecutor.run(cmd);
    Logger.success('✅ Last commit amended successfully!');
  },

  /**
   * Undo last commit (keep changes staged)
   */
  async undoLastCommit() {
    Logger.info('↩️ Undoing last commit (keeping changes)...');
    await GitExecutor.run('git reset --soft HEAD~1');
    Logger.success('✅ Last commit undone. Changes remain staged.');
  },

  /**
   * Show last commit details
   */
  async showLastCommit() {
    Logger.info('📜 Showing last commit details...');
    await GitExecutor.run('git show HEAD --stat --pretty=medium');
  },

  /**
   * View commit history (graph)
   */
  async showLog() {
    const { format } = await inquirer.prompt([
      {
        type: 'list',
        name: 'format',
        message: 'Select log format:',
        choices: [
          { name: 'Compact (oneline)', value: '--oneline' },
          { name: 'Detailed (default)', value: '' },
          { name: 'Graph view', value: '--oneline --graph --decorate' },
        ],
      },
    ]);

    const cmd = `git log ${format}`;
    Logger.info('📜 Viewing commit history...');
    await GitExecutor.run(cmd);
  },

  /**
   * Show unstaged diff
   */
  async showDiff() {
    Logger.info('🔍 Showing unstaged changes...');
    await GitExecutor.run('git diff');
  },

  /**
   * Show staged diff
   */
  async showStagedDiff() {
    Logger.info('🔍 Showing staged (cached) changes...');
    await GitExecutor.run('git diff --cached');
  },
};
