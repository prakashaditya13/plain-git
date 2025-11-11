import inquirer from 'inquirer';
import { GitExecutor } from '../core/GitExecutor';
import { Logger } from '../utils/Logger';

export const RepositoryManager = {
  async initRepo() {
    Logger.info('🌀 Initializing new Git repository...');
    await GitExecutor.run('git init');
  },

  async status() {
    Logger.info('📋 Checking repository status...');
    await GitExecutor.run('git status');
  },

  
};
