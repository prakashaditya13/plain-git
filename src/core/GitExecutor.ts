import { exec } from 'child_process';
import { promisify } from 'util';
import { Logger } from '../utils/Logger';

const execAsync = promisify(exec);

export class GitExecutor {
  /**
   * Run any Git command safely.
   */
  static async run(command: string): Promise<string> {
    try {
      const { stdout } = await execAsync(command);
      return stdout.trim();
    } catch (err) {
      throw new Error(`Git command failed: ${command}`);
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
