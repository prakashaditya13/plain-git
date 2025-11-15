/**
 * 🎒 StashManager.ts
 * -------------------------------------------------------------
 * Handles stashing, applying, listing, and deleting stash entries.
 * Provides full interactive selection and safe operations.
 * -------------------------------------------------------------
 */

import inquirer from 'inquirer';
import { execSync } from 'child_process';
import { GitExecutor } from '../core/GitExecutor';
import { Logger } from '../utils/Logger';


/**
 * Helper: get stash list
 */
function getStashList(): string[] {
  try {
    const out = execSync('git stash list', { encoding: 'utf-8' });
    return out.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

export const StashManager = {
  /**
   * 🎒 Create a new stash
   */
  async createStash() {
    const { message } = await inquirer.prompt([
      {
        type: 'input',
        name: 'message',
        message: 'Enter stash message (optional):',
      },
    ]);

    const cmd = message.trim() ? `git stash push -m "${message}"` : 'git stash push';

    Logger.info('🎒 Saving changes to stash...');
    await GitExecutor.run(cmd);
    Logger.success('✅ Changes stashed successfully!');
  },

  /**
   * 📜 List stash entries
   */
  async listStashes() {
    Logger.info('📜 Listing stash entries...\n');
    await GitExecutor.run('git stash list');
  },

  /**
   * ◀️ Apply a stash (but keep it)
   */
  async applyStash() {
    const stashes = getStashList();

    if (stashes.length === 0) {
      Logger.info('ℹ️ No stashes available.');
      return;
    }

    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message: 'Select a stash to apply:',
        choices: stashes.map((s) => ({
          name: s,
          value: s.split(':')[0], // stash@{0}
        })),
      },
    ]);

    Logger.info(`◀️ Applying ${selected}...`);
    await GitExecutor.run(`git stash apply ${selected}`);
    Logger.success('✅ Stash applied!');
  },

  /**
   * ⬆️ Pop (apply + delete)
   */
  async popStash() {
    const stashes = getStashList();

    if (!stashes.length) {
      Logger.info('ℹ️ No stashes available.');
      return;
    }

    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message: 'Select a stash to pop:',
        choices: stashes.map((s) => ({
          name: s,
          value: s.split(':')[0],
        })),
      },
    ]);

    Logger.info(`⬆️ Popping ${selected}...`);
    await GitExecutor.run(`git stash pop ${selected}`);
    Logger.success('✅ Stash popped!');
  },

  /**
   * ❌ Delete a specific stash
   */
  async dropStash() {
    const stashes = getStashList();

    if (!stashes.length) {
      Logger.info('ℹ️ No stashes available.');
      return;
    }

    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message: 'Select a stash to delete:',
        choices: stashes.map((s) => ({
          name: s,
          value: s.split(':')[0],
        })),
      },
    ]);

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Are you sure you want to delete ${selected}?`,
        default: false,
      },
    ]);

    if (!confirm) {
      Logger.info('❎ Operation cancelled.');
      return;
    }

    Logger.info(`❌ Dropping ${selected}...`);
    await GitExecutor.run(`git stash drop ${selected}`);
    Logger.success('🗑️ Stash deleted!');
  },

  /**
   * 🧹 Clear all stashes
   */
  async clearStashes() {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'This will delete ALL stash entries. Continue?',
        default: false,
      },
    ]);

    if (!confirm) {
      Logger.info('❎ Stash clear cancelled.');
      return;
    }

    Logger.info('🧹 Clearing all stashes...');
    await GitExecutor.run('git stash clear');
    Logger.success('🗑️ All stashes cleared!');
  },
};
