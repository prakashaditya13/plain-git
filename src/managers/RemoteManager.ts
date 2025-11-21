/**
 * 🌎 RemoteManager.ts
 * -------------------------------------------------------------
 * Handles all remote-related Git operations:
 * - Listing, adding, renaming, and removing remotes
 * - Pushing, pulling, and fetching
 * - Syncing remotes and updating URLs
 * -------------------------------------------------------------
 */

import inquirer from 'inquirer';
import { execSync } from 'child_process';
import { GitExecutor } from '../core/GitExecutor';
import { Logger } from '../utils/Logger';

/**
 * Helper: get list of remote names
 */
function getRemoteList(): string[] {
  try {
    const raw = execSync('git remote', { encoding: 'utf-8' });
    return raw
      .split('\n')
      .map((r) => r.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export const RemoteManager = {
  /**
   * 🔗 List all remotes
   */
  async listRemotes() {
    Logger.info('🔗 Listing all configured remotes...');
    await GitExecutor.run('git remote -v');
  },

  /**
   * ➕ Add a new remote
   */
  async addRemote() {
    const { name, url } = await inquirer.prompt([
      { type: 'input', name: 'name', message: 'Enter remote name (e.g. origin):' },
      { type: 'input', name: 'url', message: 'Enter remote URL:' },
    ]);

    Logger.info(`➕ Adding remote '${name}'...`);
    await GitExecutor.run(`git remote add ${name} ${url}`);
    Logger.success(`✅ Remote '${name}' added successfully!`);
  },

  /**
   * ✏️ Rename an existing remote
   */
  async renameRemote() {
    const remotes = getRemoteList();
    if (!remotes.length) {
      Logger.info('⚠️ No remotes found.');
      return;
    }

    const { oldName } = await inquirer.prompt([
      { type: 'list', name: 'oldName', message: 'Select remote to rename:', choices: remotes },
    ]);

    const { newName } = await inquirer.prompt([
      { type: 'input', name: 'newName', message: `Enter new name for '${oldName}':` },
    ]);

    Logger.info(`✏️ Renaming remote '${oldName}' → '${newName}'...`);
    await GitExecutor.run(`git remote rename ${oldName} ${newName}`);
    Logger.success(`✅ Remote renamed to '${newName}'.`);
  },

  /**
   * 🗑️ Remove a remote
   */
  async removeRemote() {
    const remotes = getRemoteList();
    if (!remotes.length) {
      Logger.info('⚠️ No remotes found.');
      return;
    }

    const { name } = await inquirer.prompt([
      { type: 'list', name: 'name', message: 'Select remote to remove:', choices: remotes },
    ]);

    Logger.info(`🗑️ Removing remote '${name}'...`);
    await GitExecutor.run(`git remote remove ${name}`);
    Logger.success(`✅ Remote '${name}' removed successfully!`);
  },

  /**
   * ⚙️ Change a remote URL
   */
  async updateRemoteUrl() {
    const remotes = getRemoteList();
    if (!remotes.length) {
      Logger.info('⚠️ No remotes found.');
      return;
    }

    const { name } = await inquirer.prompt([
      { type: 'list', name: 'name', message: 'Select remote to update URL:', choices: remotes },
    ]);

    const { url } = await inquirer.prompt([
      { type: 'input', name: 'url', message: 'Enter new remote URL:' },
    ]);

    Logger.info(`🔄 Updating URL for remote '${name}'...`);
    await GitExecutor.run(`git remote set-url ${name} ${url}`);
    Logger.success(`✅ Remote '${name}' URL updated!`);
  },

  /**
   * 🚀 Push changes to remote
   */
  async pushChanges() {
    const remotes = getRemoteList();
    // Step 1 — If no remotes, ask user to add one
    if (remotes.length === 0) {
      Logger.error('❌ No remote found for this repository.');

      const { url } = await inquirer.prompt([
        { type: 'input', name: 'url', message: "Enter remote URL to add as 'origin':" },
      ]);

      Logger.info(`🔗 Adding remote origin → ${url}`);
      await GitExecutor.run(`git remote add origin ${url}`);
      remotes.push('origin');
    }

    // Step 2 — Detect current branch
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();

    // Step 3 — Check if branch has upstream
    let hasUpstream = true;
    try {
      execSync('git rev-parse --abbrev-ref --symbolic-full-name @{u}');
    } catch {
      hasUpstream = false;
    }

    // Step 4 — If no upstream, push -u
    if (!hasUpstream) {
      Logger.info(`🚀 First-time push detected for branch '${currentBranch}'.`);
      Logger.info(`Setting upstream to origin/${currentBranch}...`);
      await GitExecutor.run(`git push -u origin ${currentBranch}`);
      Logger.success('✅ Pushed & upstream tracking set!');
      return;
    }

    // Step 5 — Normal push
    Logger.info(`🚀 Pushing changes to remote...`);
    await GitExecutor.run(`git push`);
    Logger.success('✅ Changes pushed!');
  },

  /**
   * 🚀 Push and set upstream
   */
  async pushWithUpstream() {
    const remotes = getRemoteList();
    const { remote, branch } = await inquirer.prompt([
      {
        type: 'list',
        name: 'remote',
        message: 'Select remote:',
        choices: remotes.length ? remotes : ['origin'],
      },
      { type: 'input', name: 'branch', message: 'Enter branch name to push:' },
    ]);

    Logger.info(`🚀 Pushing '${branch}' to '${remote}' (set upstream)...`);
    await GitExecutor.run(`git push -u ${remote} ${branch}`);
    Logger.success(`✅ Upstream branch '${branch}' set to '${remote}'.`);
  },

  /**
   * ⬇️ Pull changes from remote
   */
  async pullChanges() {
    const remotes = getRemoteList();
    const { remote } = await inquirer.prompt([
      {
        type: 'list',
        name: 'remote',
        message: 'Select remote to pull from:',
        choices: remotes.length ? remotes : ['origin'],
      },
    ]);

    Logger.info(`⬇️ Pulling changes from '${remote}'...`);
    await GitExecutor.run(`git pull ${remote}`);
    Logger.success(`✅ Pulled latest changes from '${remote}'.`);
  },

  /**
   * 🔍 Fetch updates without merging
   */
  async fetchUpdates() {
    const remotes = getRemoteList();
    const { remote } = await inquirer.prompt([
      {
        type: 'list',
        name: 'remote',
        message: 'Select remote to fetch from:',
        choices: [...remotes, 'all'],
      },
    ]);

    const cmd = remote === 'all' ? 'git fetch --all' : `git fetch ${remote}`;
    Logger.info(`🔍 Fetching updates from ${remote}...`);
    await GitExecutor.run(cmd);
    Logger.success(`✅ Fetched updates from ${remote}.`);
  },

  /**
   * 🌎 Show remote details
   */
  async showRemoteInfo() {
    const remotes = getRemoteList();
    if (!remotes.length) {
      Logger.info('⚠️ No remotes found.');
      return;
    }

    const { remote } = await inquirer.prompt([
      { type: 'list', name: 'remote', message: 'Select remote to view info:', choices: remotes },
    ]);

    Logger.info(`🌎 Showing information for remote '${remote}'...`);
    await GitExecutor.run(`git remote show ${remote}`);
  },

  /**
   * 🔄 Sync all remotes (fetch + pull)
   */
  async syncAll() {
    Logger.info('🔄 Fetching and pulling from all remotes...');
    await GitExecutor.run('git fetch --all && git pull --all');
    Logger.success('✅ All remotes synchronized!');
  },
};
