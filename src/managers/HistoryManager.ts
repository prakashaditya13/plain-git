/**
 * 🕓 HistoryManager.ts
 * -------------------------------------------------------------
 * Provides detailed insights into commit history, diffs,
 * authorship, and file evolution.
 * -------------------------------------------------------------
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { GitExecutor } from '../core/GitExecutor';
import { Logger } from '../utils/Logger';


/**
 * Helper: fetch recent commits (for interactive selection)
 */
function getRecentCommits(limit = 20): string[] {
  try {
    const out = execSync(`git log --oneline -n ${limit}`, { encoding: 'utf-8' });
    return out.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Helper: get tracked files
 */
function getTrackedFiles(): string[] {
  try {
    const out = execSync('git ls-files', { encoding: 'utf-8' });
    return out.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

export const HistoryManager = {
  /**
   * 📜 View commit history
   */
  async showHistoryGraph() {
    const { format } = await inquirer.prompt([
      {
        type: 'list',
        name: 'format',
        message: 'Select log format:',
        choices: [
          { name: 'Compact view (oneline)', value: '--oneline' },
          { name: 'Graph view', value: '--oneline --graph --decorate' },
          { name: 'Detailed view', value: '' },
          { name: 'Include author and date', value: "--pretty=format:'%h - %an, %ar : %s'" },
        ],
      },
    ]);

    const cmd = `git log ${format}`;
    Logger.info('🕓 Showing commit history...');
    await GitExecutor.run(cmd);
  },

  /**
   * 🧾 View reflog (actions like reset, merge, etc.)
   */
  async showReflog() {
    Logger.info('🧾 Viewing Git reflog...');
    await GitExecutor.run('git reflog --date=relative');
  },

  /**
   * 🔍 Show commit details
   */
  async showCommitDetails() {
    const commits = getRecentCommits();
    if (!commits.length) {
      Logger.info('⚠️ No commits found.');
      return;
    }

    const { commit } = await inquirer.prompt([
      { type: 'list', name: 'commit', message: 'Select commit to view:', choices: commits },
    ]);

    const commitHash = commit.split(' ')[0];
    Logger.info(`🔍 Showing details for commit ${chalk.bold(commitHash)}...`);
    await GitExecutor.run(`git show ${commitHash} --stat`);
  },

  /**
   * 🔁 Compare changes between two commits
   */
  async compareCommits() {
    const commits = getRecentCommits(30);
    if (commits.length < 2) {
      Logger.info('⚠️ Need at least two commits to compare.');
      return;
    }

    const { commit1, commit2 } = await inquirer.prompt([
      { type: 'list', name: 'commit1', message: 'Select first commit:', choices: commits },
      { type: 'list', name: 'commit2', message: 'Select second commit:', choices: commits },
    ]);

    const hash1 = commit1.split(' ')[0];
    const hash2 = commit2.split(' ')[0];
    Logger.info(`🔁 Comparing commits ${hash1} ↔ ${hash2}...`);
    await GitExecutor.run(`git diff ${hash1} ${hash2}`);
  },

  /**
   * 🔍 Compare working directory with last commit
   */
  async showDiff() {
    Logger.info('🔍 Comparing working directory with last commit...');
    await GitExecutor.run('git diff');
  },

  /**
   * 🧩 Show diff for a specific file
   */
  async showFileDiff() {
    const files = getTrackedFiles();
    if (!files.length) {
      Logger.info('⚠️ No tracked files found.');
      return;
    }

    const { file } = await inquirer.prompt([
      { type: 'list', name: 'file', message: 'Select file to view diff:', choices: files },
    ]);

    Logger.info(`🧩 Showing changes for file '${file}'...`);
    await GitExecutor.run(`git diff ${file}`);
  },

  /**
   * 📂 Show history for a specific file
   */
  async showFileHistory() {
    const files = getTrackedFiles();
    if (!files.length) {
      Logger.info('⚠️ No tracked files found.');
      return;
    }

    const { file } = await inquirer.prompt([
      { type: 'list', name: 'file', message: 'Select file to view history:', choices: files },
    ]);

    Logger.info(`📂 Showing commit history for '${file}'...`);
    await GitExecutor.run(`git log --oneline --graph --decorate -- ${file}`);
  },

  /**
   * 👤 Blame a file (see who changed each line)
   */
  async blameFile() {
    const files = getTrackedFiles();
    if (!files.length) {
      Logger.info('⚠️ No tracked files found.');
      return;
    }

    const { file } = await inquirer.prompt([
      { type: 'list', name: 'file', message: 'Select file to blame:', choices: files },
    ]);

    Logger.info(`👤 Blaming file '${file}'...`);
    await GitExecutor.run(`git blame ${file}`);
  },

  /**
   * 🧑‍💻 Shortlog by author
   */
  async showAuthorSummary() {
    Logger.info('🧑‍💻 Generating author commit summary...');
    await GitExecutor.run('git shortlog -sn --all');
  },
};
