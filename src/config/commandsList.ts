/**
 * 📜 commandsList.ts
 * -------------------------------------------------------------
 * Central list of all plain-English Git actions,
 * their Git commands, and mapped handlers.
 * -------------------------------------------------------------
 */

export type PlainGitCommand = {
  category: string;
  name: string;
  command: string;
  description: string;
  handler: string; // maps to specific Manager method
};

export const COMMANDS_LIST: PlainGitCommand[] = [
  // 🏁 Repository Operations
  {
    category: 'Repository',
    name: '📦 Initialize a new repository',
    command: 'git init',
    description: 'Create a new local Git repository in the current folder.',
    handler: 'RepositoryManager.initRepo',
  },
  {
    category: 'Repository',
    name: '📦 Initialize a bare repository',
    command: 'git init --bare',
    description: 'Create a bare Git repository (no working directory).',
    handler: 'RepositoryManager.initRepo',
  },
  {
    category: 'Repository',
    name: '🌐 Clone a repository from URL',
    command: 'git clone <url> [folder]',
    description: 'Clone an existing repository from a remote Git URL.',
    handler: 'RepositoryManager.cloneRepo',
  },
  {
    category: 'Repository',
    name: '📂 Check repository status',
    command: 'git status [-s]',
    description: 'Display the current working tree status (short or detailed).',
    handler: 'RepositoryManager.status',
  },
  {
    category: 'Repository',
    name: '⚙️ Show Git configuration',
    command: 'git config --list [--global | --local | --system]',
    description: 'Show Git configuration for the selected scope.',
    handler: 'RepositoryManager.showConfig',
  },
  {
    category: 'Repository',
    name: '🧩 Set Git configuration value',
    command: 'git config [--global] <key> <value>',
    description: 'Set or update a Git configuration key/value pair.',
    handler: 'RepositoryManager.setConfig',
  },
  {
    category: 'Repository',
    name: '🔗 List remotes',
    command: 'git remote -v',
    description: 'List all configured remote repositories.',
    handler: 'RepositoryManager.listRemotes',
  },
  {
    category: 'Repository',
    name: '➕ Add a new remote',
    command: 'git remote add <name> <url>',
    description: 'Add a new remote repository by name and URL.',
    handler: 'RepositoryManager.addRemote',
  },
  {
    category: 'Repository',
    name: '✏️ Update existing remote URL',
    command: 'git remote set-url <name> <new-url>',
    description: 'Change the URL for an existing remote repository.',
    handler: 'RepositoryManager.updateRemote',
  },
  {
    category: 'Repository',
    name: '🗑️ Remove a remote',
    command: 'git remote remove <name>',
    description: 'Remove a remote repository from configuration.',
    handler: 'RepositoryManager.removeRemote',
  },
  {
    category: 'Repository',
    name: '🔍 Show repository info (HEAD + Root)',
    command: 'git rev-parse --show-toplevel && git rev-parse --abbrev-ref HEAD',
    description: 'Show repository root directory and current branch info.',
    handler: 'RepositoryManager.showRepoInfo',
  },
  {
    category: 'Repository',
    name: '🧹 Optimize repository (cleanup & GC)',
    command: 'git gc --prune=now --aggressive',
    description: 'Run Git garbage collection to optimize repository size.',
    handler: 'RepositoryManager.optimizeRepo',
  },
  {
    category: 'Repository',
    name: '🔎 Verify repository integrity',
    command: 'git fsck --full',
    description: 'Check repository for corrupted or missing objects.',
    handler: 'RepositoryManager.verifyRepo',
  },

  // 🌿 Branch Operations
  {
    category: 'Branch',
    name: '🌱 Create a new branch',
    command: 'git branch <branch-name>',
    description: 'Create a new branch locally (does not switch).',
    handler: 'BranchManager.createBranch',
  },
  {
    category: 'Branch',
    name: '🌿 Create and switch to a new branch',
    command: 'git switch -c <branch-name> | git checkout -b <branch-name>',
    description: 'Create a new branch and immediately switch to it.',
    handler: 'BranchManager.createAndSwitch',
  },
  {
    category: 'Branch',
    name: '🔄 Switch to another branch',
    command: 'git switch <branch-name> | git checkout <branch-name>',
    description: 'Switch to an existing branch interactively.',
    handler: 'BranchManager.switchBranch',
  },
  {
    category: 'Branch',
    name: '🗑️ Delete a branch (safe delete)',
    command: 'git branch -d <branch-name>',
    description: 'Delete a local branch that has already been merged.',
    handler: 'BranchManager.deleteBranch',
  },
  {
    category: 'Branch',
    name: '💣 Force delete a branch',
    command: 'git branch -D <branch-name>',
    description: 'Force delete a local branch (even if unmerged).',
    handler: 'BranchManager.deleteBranch',
  },
  {
    category: 'Branch',
    name: '✏️ Rename a branch',
    command: 'git branch -m <old-name> <new-name>',
    description: 'Rename an existing local branch.',
    handler: 'BranchManager.renameBranch',
  },
  {
    category: 'Branch',
    name: '📋 List all branches',
    command: 'git branch --all --verbose',
    description: 'List all local and remote branches with details.',
    handler: 'BranchManager.listBranches',
  },
  {
    category: 'Branch',
    name: '📍 Show current branch',
    command: 'git branch --show-current',
    description: 'Display the name of the branch you are currently on.',
    handler: 'BranchManager.showCurrentBranch',
  },
  {
    category: 'Branch',
    name: '🚀 Push branch to remote and set upstream',
    command: 'git push -u <remote> <branch>',
    description: 'Push a branch to a remote repository and set upstream tracking.',
    handler: 'BranchManager.pushBranch',
  },
  {
    category: 'Branch',
    name: '📍 Show and list all branches (summary)',
    command: 'git branch --show-current && git branch --all',
    description: 'Display the current branch and a list of all branches.',
    handler: 'BranchManager.showAndList',
  },

  // 📝 Commit Operations
  // 📝 Commit Operations
  {
    category: 'Commit',
    name: '🧩 Stage all changes',
    command: 'git add .',
    description: 'Stage all modified and untracked files.',
    handler: 'CommitManager.stageAll',
  },
  {
    category: 'Commit',
    name: '🧩 Stage specific files',
    command: 'git add <file>',
    description: 'Interactively select specific files to stage.',
    handler: 'CommitManager.stageFiles',
  },
  {
    category: 'Commit',
    name: '🗑️ Unstage files',
    command: 'git restore --staged <file>',
    description: 'Remove files from staging area (unstage).',
    handler: 'CommitManager.unstageFiles',
  },
  {
    category: 'Commit',
    name: '📝 Commit staged changes',
    command: "git commit -m '<message>'",
    description: 'Commit all staged changes with a message.',
    handler: 'CommitManager.commitChanges',
  },
  {
    category: 'Commit',
    name: '✏️ Amend last commit message',
    command: "git commit --amend -m '<new-message>'",
    description: 'Edit or replace the most recent commit message.',
    handler: 'CommitManager.amendLastCommit',
  },
  {
    category: 'Commit',
    name: '↩️ Undo last commit (keep changes)',
    command: 'git reset --soft HEAD~1',
    description: 'Undo the most recent commit but keep changes staged.',
    handler: 'CommitManager.undoLastCommit',
  },
  {
    category: 'Commit',
    name: '📜 Show last commit details',
    command: 'git show HEAD',
    description: 'View details of the most recent commit.',
    handler: 'CommitManager.showLastCommit',
  },
  {
    category: 'Commit',
    name: '📚 View commit history (graph)',
    command: 'git log --oneline --graph --decorate',
    description: 'Display commit history in graphical format.',
    handler: 'CommitManager.showLog',
  },
  {
    category: 'Commit',
    name: '🔍 View unstaged changes (diff)',
    command: 'git diff',
    description: 'Show changes not yet staged for commit.',
    handler: 'CommitManager.showDiff',
  },
  {
    category: 'Commit',
    name: '🔍 View staged changes (cached diff)',
    command: 'git diff --cached',
    description: 'Show differences between staged and last commit.',
    handler: 'CommitManager.showStagedDiff',
  },

  // 🚀 Remote Operations
  {
    category: 'Remote',
    name: '🚀 Push changes to remote',
    command: 'git push',
    description: 'Push local commits to the default remote branch.',
    handler: 'RemoteManager.pushChanges',
  },
  {
    category: 'Remote',
    name: '⬇️ Pull latest changes',
    command: 'git pull',
    description: 'Pull changes from the remote branch into your local branch.',
    handler: 'RemoteManager.pullChanges',
  },
  {
    category: 'Remote',
    name: '🔍 Fetch updates from remote',
    command: 'git fetch',
    description: 'Fetch remote changes without merging them.',
    handler: 'RemoteManager.fetchUpdates',
  },

  // 🕓 History & Diff
  {
    category: 'History',
    name: '🕓 View commit history (graph)',
    command: 'git log --oneline --graph --decorate',
    description: 'Show commits with visual branch structure.',
    handler: 'HistoryManager.showHistoryGraph',
  },
  {
    category: 'History',
    name: '🔍 Compare changes (diff)',
    command: 'git diff',
    description: 'Compare working directory with last commit.',
    handler: 'HistoryManager.showDiff',
  },

  // 🧹 Reset & Cleanup
  {
    category: 'Reset',
    name: '↩️ Undo last commit (soft)',
    command: 'git reset --soft HEAD~1',
    description: 'Undo last commit but keep changes staged.',
    handler: 'ResetManager.undoLastCommit',
  },
  {
    category: 'Reset',
    name: '🧹 Clean untracked files',
    command: 'git clean -fd',
    description: 'Remove all untracked files and folders.',
    handler: 'ResetManager.cleanUntracked',
  },
];
