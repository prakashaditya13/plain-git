#!/usr/bin/env node
import inquirer from 'inquirer';
import chalk from 'chalk';
import figlet from 'figlet';
import { GitDetector } from '../core/GitDetector';
import { Logger } from '../utils/Logger';


/**
 * plain-git CLI
 * ------------------------
 * - Displays ASCII banner and startup info
 * - Checks system for Git installation and repo availability
 * - Shows interactive menu of Git actions
 * - Handles selected operations (stubs for now)
 * - Designed for cross-platform Node.js CLI execution
 */

// Draw a beautiful header
function showBanner() {
  console.clear();
  console.log(chalk.cyanBright(figlet.textSync('Plain-Git', { horizontalLayout: 'default' })));
  console.log(chalk.gray('✨ Operate Git in plain English.\n'));

  Logger.info("🚀 Initializing plain-git environment check...\n");
}

/**
 * Displays the interactive menu options for the developer.
 */
async function showMenu(): Promise<string> {
  const choices = [
    { name: '📦 Initialize a new Git repository', value: 'init' },
    { name: '📂 Check repository status', value: 'status' },
    { name: '🌿 Create a new branch', value: 'branch' },
    { name: '📝 Commit changes', value: 'commit' },
    { name: '🚀 Push changes to remote', value: 'push' },
    { name: '⬇️ Pull latest changes', value: 'pull' },
    { name: '❌ Exit', value: 'exit' },
  ];

  const { command } = await inquirer.prompt([
    {
      type: 'list',
      name: 'command',
      message: 'What would you like to do?',
      choices,
    },
  ]);

  return command;
}

/**
 * Handles user-selected menu commands.
 */
async function handleCommand(command: string) {
  switch (command) {
    case 'init':
      //   await RepositoryManager.init();
      break;
    case 'status':
      //   await RepositoryManager.status();
      break;
    case 'branch':
      //   await RepositoryManager.createBranch();
      break;
    case 'commit':
      //   await RepositoryManager.commitChanges();
      break;
    case 'push':
      //   await RepositoryManager.pushChanges();
      break;
    case 'pull':
      //   await RepositoryManager.pullChanges();
      break;
    default:
      Logger.info('👋 Goodbye!');
      process.exit(0);
  }
}

/**
 * Main entry function
 */
(async function main() {
  console.clear();
  // Welcome banner
  showBanner();

  // Step 1: Ensure Git is available and check environment
  await GitDetector.checkEnvironment();

  Logger.success("\n🎯 Environment ready! You can start using plain-git commands.");

  // Step 2: Interactive menu
  while (true) {
    const selected = await showMenu();
    await handleCommand(selected);
    console.log('\n');
  }
})();
