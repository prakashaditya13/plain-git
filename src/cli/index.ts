#!/usr/bin/env node
import inquirer from 'inquirer';
import chalk from 'chalk';
import figlet from 'figlet';
import { GitDetector } from '../core/GitDetector';
import { Logger } from '../utils/Logger';
import { COMMANDS_LIST } from '../config/commandsList';
import { handleCommand } from '../core/HandleCommands';
import { BranchDetector } from '../core/BranchDetector';

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

  Logger.info('🚀 Initializing plain-git environment check...\n');
}

/**
 * Displays the interactive menu options for the developer.
 * Dynamically build menu from COMMANDS_LIST
 */
async function showMenu(): Promise<void> {
  const currentBranch = BranchDetector.getCurrentBranch();

  console.log();
  if (currentBranch) {
    console.log(chalk.cyanBright(`📍 Current branch: ${chalk.bold(currentBranch)}`));
  } else {
    console.log(chalk.gray('📍 Not inside a Git repository'));
  }
  console.log(chalk.gray('--------------------------------------------------\n'));

  // Count total commands and categories
  const totalOperations = COMMANDS_LIST.length;
  const categories = [...new Set(COMMANDS_LIST.map((cmd) => cmd.category))];
  const totalCategories = categories.length;

  console.log(chalk.yellowBright(`\n📊 Total operations available: ${totalOperations}`));
  console.log(chalk.yellowBright(`📁 Categories: ${totalCategories} (${categories.join(', ')})`));

  console.log(chalk.gray('\n--------------------------------------------------\n'));

  // Group COMMANDS_LIST by category
  const grouped = COMMANDS_LIST.reduce<Record<string, typeof COMMANDS_LIST>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  const choices: any[] = [];

  // Build grouped menu
  for (const [category, cmds] of Object.entries(grouped)) {
    choices.push(
      new inquirer.Separator(chalk.cyanBright.bold(`── ${category.toUpperCase()} COMMANDS ──`)),
    );

    cmds.forEach((cmd) => {
      choices.push({
        name: `${cmd.name} ${cmd.command.includes('<') ? chalk.gray('(requires input)') : ''}`,
        value: cmd.handler,
        short: cmd.category,
      });
    });
  }

  choices.push(new inquirer.Separator());
  choices.push({ name: chalk.redBright('❌ Exit'), value: 'exit' });

  // Interactive prompt
  const { selected } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selected',
      message: 'Select a Git operation to perform:',
      pageSize: Math.min(process.stdout.rows - 6, choices.length),
      choices,
    },
  ]);

  if (selected === 'exit') {
    Logger.info('👋 Exiting plain-git.');
    process.exit(0);
  }

  await handleCommand(selected);
  Logger.success('\n✅ Operation completed successfully!\n');

  process.exit(0);

  //   await showMenu(); // loop back
}

/**
 * Local placeholder removed: using imported handleCommand from '../core/HandleCommands'.
 */

/**
 * Main entry function
 */
(async function main() {
  try {
    console.clear();
    // Welcome banner
    showBanner();

    // Step 1: Ensure Git is available and check environment
    await GitDetector.checkEnvironment();

    Logger.success('\n🎯 Environment ready! You can start using plain-git commands.');

    // Step 2: Launch category-based command menu
    await showMenu();
  } catch (error) {
    Logger.error(`❌ Something went wrong: ${(error as Error).message}`);
  }
})();
