import {RepositoryManager, BranchManager, CommitManager, RemoteManager, ResetManager, HistoryManager} from '../managers'
import { Logger } from '../utils/Logger';

const managerMap: Record<string, any> = {
  RepositoryManager,
  BranchManager,
  CommitManager,
  RemoteManager,
  HistoryManager,
  ResetManager,
};

export async function handleCommand(handlerPath: string) {
  try {
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