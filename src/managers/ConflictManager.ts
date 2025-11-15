/**
 * ⚔️ ConflictManager.ts
 * -------------------------------------------------------------
 * Provides conflict detection, file inspection, conflict marker
 * highlighting, VSCode opening, and help guidance.
 * Works for merge, rebase, and cherry-pick conflicts.
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
 * Get list of files that contain unresolved conflicts (U state)
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

/**
 * Read conflict markers inside file
 */
function readConflictMarkers(filePath: string): string[] {
  const absPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(absPath)) return [];

  const lines = fs.readFileSync(absPath, 'utf-8').split('\n');
  const markers = [];

  let inConflict = false;

  for (const line of lines) {
    if (line.startsWith('<<<<<<<')) {
      markers.push(chalk.red('<<<<<<< HEAD'));
      inConflict = true;
    } else if (line.startsWith('=======')) {
      markers.push(chalk.yellow('======='));
    } else if (line.startsWith('>>>>>>>')) {
      markers.push(chalk.green('>>>>>>> Incoming'));
      inConflict = false;
    } else if (inConflict) {
      markers.push(`    ${line}`);
    }
  }

  return markers;
}

export const ConflictManager = {
  /**
   * ⚠️ Show files with merge conflicts
   */
  async listConflicts() {
    const files = getConflictedFiles();

    if (!files.length) {
      Logger.success('🎉 No conflicts found.');
      return;
    }

    Logger.error('⚠️ Conflicting files:');
    files.forEach((f) => console.log(chalk.red(`  - ${f}`)));
  },

  /**
   * 📄 Show conflict markers inside a selected file
   */
  async inspectConflict() {
    const files = getConflictedFiles();

    if (!files.length) {
      Logger.info('🎉 No conflicts to inspect.');
      return;
    }

    const { file } = await inquirer.prompt([
      {
        type: 'list',
        name: 'file',
        message: 'Select a file to inspect:',
        choices: files,
      },
    ]);

    Logger.info(`📄 Inspecting conflicts in: ${file}\n`);

    const markers = readConflictMarkers(file);

    if (!markers.length) {
      Logger.info('ℹ️ No conflict markers found inside this file.');
      return;
    }

    markers.forEach((m) => console.log(m));

    console.log(
      chalk.yellow(
        `\nFix the conflicts inside this file, then run:\n  git add ${file}\n  git merge --continue (or rebase/cherry-pick continue)\n`,
      ),
    );
  },

  /**
   * 🧭 Open the conflicting file in VS Code
   */
  async openInEditor() {
    const files = getConflictedFiles();

    if (!files.length) {
      Logger.info('🎉 No conflicts to open.');
      return;
    }

    const { file } = await inquirer.prompt([
      {
        type: 'list',
        name: 'file',
        message: 'Select a file to open in VSCode:',
        choices: files,
      },
    ]);

    Logger.info(`🧭 Opening VSCode for: ${file}`);
    await GitExecutor.run(`code ${file}`);
  },

  /**
   * 🧪 Show diff for a conflicting file
   */
  async showConflictDiff() {
    const files = getConflictedFiles();

    if (!files.length) {
      Logger.info('🎉 No conflicts to diff.');
      return;
    }

    const { file } = await inquirer.prompt([
      {
        type: 'list',
        name: 'file',
        message: 'Select a file to diff:',
        choices: files,
      },
    ]);

    Logger.info(`🔍 Showing diff for ${file}`);
    await GitExecutor.run(`git diff ${file}`);
  },

  /**
   * ℹ️ Explain how to resolve Git conflicts
   */
  async conflictHelp() {
    console.log(
      chalk.cyan(`
🧠 How to Resolve Git Conflicts
--------------------------------
When Git shows conflict markers inside a file, it looks like:

  <<<<<<< HEAD
    your changes
  =======
    incoming changes
  >>>>>>> branch-name

✔ Decide which version to keep
✔ Or combine both changes manually
✔ Remove all conflict markers
✔ Save the file
✔ Run: git add <file>
✔ Then run: git merge --continue (or rebase/cherry-pick continue)

Use "Inspect Conflict" to view markers inside the file.
Use "Open in VS Code" to edit faster.
`),
    );
  },
};
