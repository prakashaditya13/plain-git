import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { Logger } from '../utils/Logger';
import chalk from 'chalk';

const execAsync = promisify(exec);

export class GitExecutor {
  /**
   * Execute any Git command with real-time streaming output.
   * Best for CLI tools.
   */
  static async run(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(' ');

      Logger.info(chalk.gray(`\n$ ${command}\n`)); // show actual command

      const child = spawn(cmd, args, {
        stdio: ['inherit', 'pipe', 'pipe'], // stdin inherited, output piped
        shell: true, // required for commands with flags
      });

      // Stream STDOUT live
      child.stdout.on('data', (data) => {
        process.stdout.write(chalk.greenBright(data.toString()));
      });

      // Stream STDERR live (git status, warnings, errors)
      child.stderr.on('data', (data) => {
        process.stdout.write(chalk.yellowBright(data.toString()));
      });

      // When command finishes
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          Logger.error(`❌ Git exited with code ${code}`);
          reject(new Error(`Git failed with exit code ${code}`));
        }
      });

      // General fail-safe
      child.on('error', (err) => {
        Logger.error(`❌ Failed to execute command: ${err.message}`);
        reject(err);
      });
    });
  }

  /**
   * Initialize a new Git repository in the current directory.
   */
  static async initRepository(): Promise<boolean> {
    try {
      Logger.info('🧱 Initializing new Git repository...');
      await execAsync('git init');
      Logger.success('✅ Repository initialized successfully!');
      return true;
    } catch (error) {
      Logger.error('❌ Failed to initialize Git repository.');
      Logger.info((error as Error).message);
      return false;
    }
  }
}
