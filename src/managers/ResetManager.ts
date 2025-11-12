/**
 * ♻️ ResetManager.ts
 * -------------------------------------------------------------
 * Handles undo, cleanup, and reset operations in the repository.
 * Includes safe, mixed, and hard reset modes and file discards.
 * -------------------------------------------------------------
 */

import inquirer from 'inquirer';
import { execSync } from 'child_process';
import { GitExecutor } from '../core/GitExecutor';
import { Logger } from '../utils/Logger';


/**
 * Helper: list recent commits for interactive reset
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

export const ResetManager = {
  /**
   * ↩️ Undo last commit (soft reset)
   */
  async undoLastCommitSoft() {
    Logger.info('↩️ Undoing last commit (keeping staged changes)...');
    await GitExecutor.run('git reset --soft HEAD~1');
    Logger.success('✅ Last commit undone, changes remain staged.');
  },

  /**
   * 🔄 Undo last commit and unstage changes (mixed reset)
   */
  async undoLastCommitMixed() {
    Logger.info('🔄 Undoing last commit (keeping unstaged changes)...');
    await GitExecutor.run('git reset --mixed HEAD~1');
    Logger.success('✅ Last commit undone, changes kept but unstaged.');
  },

  /**
   * 💣 Undo last commit completely (hard reset)
   */
  async undoLastCommitHard() {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: '⚠️ This will remove all uncommitted changes. Continue?',
        default: false,
      },
    ]);

    if (!confirm) {
      Logger.info('❎ Operation cancelled.');
      return;
    }

    Logger.info('💣 Performing hard reset to previous commit...');
    await GitExecutor.run('git reset --hard HEAD~1');
    Logger.success('✅ Repository reset to previous commit (all changes discarded).');
  },

  /**
   * 🕓 Reset to a specific commit
   */
  async resetToSpecificCommit() {
    const commits = getRecentCommits();
    if (!commits.length) {
      Logger.info('⚠️ No commits found.');
      return;
    }

    const { commit } = await inquirer.prompt([
      { type: 'list', name: 'commit', message: 'Select commit to reset to:', choices: commits },
    ]);

    const { mode } = await inquirer.prompt([
      {
        type: 'list',
        name: 'mode',
        message: 'Choose reset type:',
        choices: [
          { name: 'Soft (keep all changes staged)', value: '--soft' },
          { name: 'Mixed (keep changes unstaged)', value: '--mixed' },
          { name: 'Hard (discard all changes)', value: '--hard' },
        ],
      },
    ]);

    const hash = commit.split(' ')[0];
    Logger.info(`🕓 Resetting repository to ${hash} (${mode.replace('--', '')} mode)...`);
    await GitExecutor.run(`git reset ${mode} ${hash}`);
    Logger.success(`✅ Repository reset to ${hash} successfully.`);
  },

  /**
   * 🧩 Discard changes for specific file(s)
   */
  async discardFileChanges() {
    const files = getModifiedFiles();
    if (!files.length) {
      Logger.info('⚠️ No modified files found.');
      return;
    }

    const { selected } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selected',
        message: 'Select files to discard changes:',
        choices: files,
      },
    ]);

    if (selected.length === 0) {
      Logger.info('No files selected.');
      return;
    }

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'This will discard local changes. Continue?',
        default: false,
      },
    ]);

    if (!confirm) return;

    for (const file of selected) {
      await GitExecutor.run(`git restore ${file}`);
      Logger.success(`✅ Discarded changes for '${file}'`);
    }
  },

  /**
   * 🧹 Clean untracked files/folders
   */
  async cleanUntracked() {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: '⚠️ Remove ALL untracked files and folders? (git clean -fd)',
        default: false,
      },
    ]);

    if (!confirm) {
      Logger.info('❎ Cleanup cancelled.');
      return;
    }

    Logger.info('🧹 Cleaning untracked files and directories...');
    await GitExecutor.run('git clean -fd');
    Logger.success('✅ Untracked files removed.');
  },

  /**
   * ⚙️ Interactive reset mode (select type)
   */
  async interactiveReset() {
    const { mode } = await inquirer.prompt([
      {
        type: 'list',
        name: 'mode',
        message: 'Select reset operation:',
        choices: [
          { name: '↩️ Undo last commit (soft)', value: 'soft' },
          { name: '🔄 Undo last commit (mixed)', value: 'mixed' },
          { name: '💣 Undo last commit (hard)', value: 'hard' },
          { name: '🕓 Reset to a specific commit', value: 'specific' },
          { name: '🧩 Discard file changes', value: 'discard' },
          { name: '🧹 Clean untracked files', value: 'clean' },
        ],
      },
    ]);

    switch (mode) {
      case 'soft':
        await this.undoLastCommitSoft();
        break;
      case 'mixed':
        await this.undoLastCommitMixed();
        break;
      case 'hard':
        await this.undoLastCommitHard();
        break;
      case 'specific':
        await this.resetToSpecificCommit();
        break;
      case 'discard':
        await this.discardFileChanges();
        break;
      case 'clean':
        await this.cleanUntracked();
        break;
    }
  },
};
