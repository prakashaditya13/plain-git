/**
 * 🧭 managerMap.ts
 * -------------------------------------------------------------
 * Central registry that maps all manager names to their modules.
 * This ensures handleCommands.ts can dynamically route any handler.
 * -------------------------------------------------------------
 */

import {RepositoryManager, BranchManager, CommitManager, RemoteManager, HistoryManager, ResetManager} from '../../managers'

export const managerMap: Record<string, any> = {
  RepositoryManager,
  BranchManager,
  CommitManager,
  RemoteManager,
  HistoryManager,
  ResetManager,
};
