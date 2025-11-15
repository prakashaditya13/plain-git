/**
 * 🏷️ TagManager.ts
 * -------------------------------------------------------------
 * Handles Git tags: listing, creating, annotating, deleting,
 * pushing, and showing tag details. Includes interactive flows.
 * -------------------------------------------------------------
 */

import inquirer from 'inquirer';
import { execSync } from 'child_process';
import { GitExecutor } from '../core/GitExecutor';
import { Logger } from '../utils/Logger';

/**
 * Helper: get tag list
 */
function getTagList(): string[] {
  try {
    const out = execSync('git tag --list', { encoding: 'utf-8' });
    return out.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

export const TagManager = {
  /**
   * 📜 List all tags
   */
  async listTags() {
    Logger.info('📜 Listing tags...\n');
    await GitExecutor.run('git tag --list');
  },

  /**
   * 🏷 Create a lightweight tag
   */
  async createTag() {
    const { tagName } = await inquirer.prompt([
      { type: 'input', name: 'tagName', message: 'Enter tag name:' },
    ]);

    Logger.info(`🏷 Creating tag '${tagName}'...`);
    await GitExecutor.run(`git tag ${tagName}`);
    Logger.success('✅ Tag created!');
  },

  /**
   * 📝 Create an annotated tag
   */
  async createAnnotatedTag() {
    const { tagName, message } = await inquirer.prompt([
      { type: 'input', name: 'tagName', message: 'Enter annotated tag name:' },
      { type: 'input', name: 'message', message: 'Enter annotation message:' },
    ]);

    Logger.info(`📝 Creating annotated tag '${tagName}'...`);
    await GitExecutor.run(`git tag -a ${tagName} -m "${message}"`);
    Logger.success('✅ Annotated tag created!');
  },

  /**
   * 🔍 Show details of a tag
   */
  async showTagDetails() {
    const tags = getTagList();

    if (!tags.length) {
      Logger.info('ℹ️ No tags found.');
      return;
    }

    const { tag } = await inquirer.prompt([
      { type: 'list', name: 'tag', message: 'Select a tag to show:', choices: tags },
    ]);

    Logger.info(`🔍 Showing details for '${tag}'...\n`);
    await GitExecutor.run(`git show ${tag}`);
  },

  /**
   * ❌ Delete a tag
   */
  async deleteTag() {
    const tags = getTagList();

    if (!tags.length) {
      Logger.info('ℹ️ No tags available to delete.');
      return;
    }

    const { tag } = await inquirer.prompt([
      { type: 'list', name: 'tag', message: 'Select a tag to delete:', choices: tags },
    ]);

    const { confirm } = await inquirer.prompt([
      { type: 'confirm', name: 'confirm', message: `Delete tag '${tag}'?`, default: false },
    ]);

    if (!confirm) {
      Logger.info('❎ Operation cancelled.');
      return;
    }

    Logger.info(`❌ Deleting tag '${tag}'...`);
    await GitExecutor.run(`git tag -d ${tag}`);
    Logger.success('🗑️ Tag deleted!');
  },

  /**
   * ☁️ Push all tags to remote
   */
  async pushTags() {
    Logger.info('☁️ Pushing all tags to remote...');
    await GitExecutor.run('git push --tags');
    Logger.success('🚀 Tags pushed!');
  },

  /**
   * ☁️ Push a single tag
   */
  async pushSingleTag() {
    const tags = getTagList();

    if (!tags.length) {
      Logger.info('ℹ️ No tags to push.');
      return;
    }

    const { tag } = await inquirer.prompt([
      { type: 'list', name: 'tag', message: 'Select tag to push:', choices: tags },
    ]);

    Logger.info(`☁️ Pushing '${tag}' to origin...`);
    await GitExecutor.run(`git push origin ${tag}`);
    Logger.success('🚀 Tag pushed!');
  },
};
