import { exec } from 'child_process';
import { promisify } from 'util';
import { Logger } from '../utils/Logger';
import chalk from 'chalk';

const execAsync = promisify(exec);

export class GitExecutor {
  /**
   * Run any Git command safely.
   */
  static async run(command: string): Promise<void> {
    try {
      const { stdout, stderr } = await execAsync(command);

      if (stdout.trim().length > 0) {
        console.log(chalk.greenBright(stdout)); // ✅ print actual output
      }

      if (stderr.trim().length > 0) {
        console.log(chalk.yellowBright(stderr)); // ⚠️ show warnings/errors
      }
    } catch (err) {
      if (err instanceof Error) {
        Logger.error(`Git command failed: ${err.message}`);
      } else {
        Logger.error('Git command failed with an unknown error.');
      }
    }
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
