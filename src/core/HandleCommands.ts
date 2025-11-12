import { Logger } from '../utils/Logger';
import { managerMap } from './registry/ManagerMap';
import { COMMANDS_LIST } from '../config/commandsList';
import chalk from 'chalk';

export async function handleCommand(handlerPath: string) {
  try {
    // Find the command details from the list
    const commandItem = COMMANDS_LIST.find((cmd) => cmd.handler === handlerPath);
    const gitCommand = commandItem ? commandItem.command : null;

    // Log which command is about to be executed
    if (gitCommand) {
      console.log(chalk.cyanBright(`\n💻 Executing command: ${chalk.bold(gitCommand)}\n`));
    } else {
      console.log(chalk.gray('\n⚙️ Executing custom handler...\n'));
    }

    const [managerName, methodName] = handlerPath.split('.');
    const manager = managerMap[managerName];

    if (!manager || typeof manager[methodName] !== 'function') {
      throw new Error(`Invalid handler: ${handlerPath}`);
    }

    await manager[methodName]();
  } catch (err) {
    Logger.error(`❌ Command failed: ${(err as Error).message}`);
  }
}
