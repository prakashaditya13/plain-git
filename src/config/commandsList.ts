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
    category: "Repository",
    name: "📦 Initialize a new repository",
    command: "git init",
    description: "Create a new local Git repository in the current folder.",
    handler: "RepositoryManager.initRepo",
  },
  {
    category: "Repository",
    name: "📦 Initialize a bare repository",
    command: "git init --bare",
    description: "Create a bare Git repository (no working directory).",
    handler: "RepositoryManager.initRepo",
  },
  {
    category: "Repository",
    name: "🌐 Clone a repository from URL",
    command: "git clone <url> [folder]",
    description: "Clone an existing repository from a remote Git URL.",
    handler: "RepositoryManager.cloneRepo",
  },
  {
    category: "Repository",
    name: "📂 Check repository status",
    command: "git status [-s]",
    description: "Display the current working tree status (short or detailed).",
    handler: "RepositoryManager.status",
  },
  {
    category: "Repository",
    name: "⚙️ Show Git configuration",
    command: "git config --list [--global | --local | --system]",
    description: "Show Git configuration for the selected scope.",
    handler: "RepositoryManager.showConfig",
  },
  {
    category: "Repository",
    name: "🧩 Set Git configuration value",
    command: "git config [--global] <key> <value>",
    description: "Set or update a Git configuration key/value pair.",
    handler: "RepositoryManager.setConfig",
  },
  {
    category: "Repository",
    name: "🔗 List remotes",
    command: "git remote -v",
    description: "List all configured remote repositories.",
    handler: "RepositoryManager.listRemotes",
  },
  {
    category: "Repository",
    name: "➕ Add a new remote",
    command: "git remote add <name> <url>",
    description: "Add a new remote repository by name and URL.",
    handler: "RepositoryManager.addRemote",
  },
  {
    category: "Repository",
    name: "✏️ Update existing remote URL",
    command: "git remote set-url <name> <new-url>",
    description: "Change the URL for an existing remote repository.",
    handler: "RepositoryManager.updateRemote",
  },
  {
    category: "Repository",
    name: "🗑️ Remove a remote",
    command: "git remote remove <name>",
    description: "Remove a remote repository from configuration.",
    handler: "RepositoryManager.removeRemote",
  },
  {
    category: "Repository",
    name: "🔍 Show repository info (HEAD + Root)",
    command: "git rev-parse --show-toplevel && git rev-parse --abbrev-ref HEAD",
    description: "Show repository root directory and current branch info.",
    handler: "RepositoryManager.showRepoInfo",
  },
  {
    category: "Repository",
    name: "🧹 Optimize repository (cleanup & GC)",
    command: "git gc --prune=now --aggressive",
    description: "Run Git garbage collection to optimize repository size.",
    handler: "RepositoryManager.optimizeRepo",
  },
  {
    category: "Repository",
    name: "🔎 Verify repository integrity",
    command: "git fsck --full",
    description: "Check repository for corrupted or missing objects.",
    handler: "RepositoryManager.verifyRepo",
  },

  // 🌿 Branch Operations
  {
    category: "Branch",
    name: "🌱 Create a new branch",
    command: "git branch <branch-name>",
    description: "Create a new branch locally.",
    handler: "BranchManager.createBranch",
  },
  {
    category: "Branch",
    name: "🔄 Switch to another branch",
    command: "git checkout <branch-name>",
    description: "Switch to an existing branch.",
    handler: "BranchManager.switchBranch",
  },
  {
    category: "Branch",
    name: "🗑️ Delete a branch",
    command: "git branch -d <branch-name>",
    description: "Delete a local branch safely.",
    handler: "BranchManager.deleteBranch",
  },

  // 📝 Commit Operations
  {
    category: "Commit",
    name: "🧩 Stage all changes",
    command: "git add .",
    description: "Add all modified files to staging.",
    handler: "CommitManager.stageAll",
  },
  {
    category: "Commit",
    name: "📝 Commit all staged changes",
    command: "git commit -m '<message>'",
    description: "Commit staged changes with a message.",
    handler: "CommitManager.commitChanges",
  },
  {
    category: "Commit",
    name: "📜 Show commit history",
    command: "git log --oneline",
    description: "Show a compact list of previous commits.",
    handler: "CommitManager.showLog",
  },

  // 🚀 Remote Operations
  {
    category: "Remote",
    name: "🚀 Push changes to remote",
    command: "git push",
    description: "Push local commits to the default remote branch.",
    handler: "RemoteManager.pushChanges",
  },
  {
    category: "Remote",
    name: "⬇️ Pull latest changes",
    command: "git pull",
    description: "Pull changes from the remote branch into your local branch.",
    handler: "RemoteManager.pullChanges",
  },
  {
    category: "Remote",
    name: "🔍 Fetch updates from remote",
    command: "git fetch",
    description: "Fetch remote changes without merging them.",
    handler: "RemoteManager.fetchUpdates",
  },

  // 🕓 History & Diff
  {
    category: "History",
    name: "🕓 View commit history (graph)",
    command: "git log --oneline --graph --decorate",
    description: "Show commits with visual branch structure.",
    handler: "HistoryManager.showHistoryGraph",
  },
  {
    category: "History",
    name: "🔍 Compare changes (diff)",
    command: "git diff",
    description: "Compare working directory with last commit.",
    handler: "HistoryManager.showDiff",
  },

  // 🧹 Reset & Cleanup
  {
    category: "Reset",
    name: "↩️ Undo last commit (soft)",
    command: "git reset --soft HEAD~1",
    description: "Undo last commit but keep changes staged.",
    handler: "ResetManager.undoLastCommit",
  },
  {
    category: "Reset",
    name: "🧹 Clean untracked files",
    command: "git clean -fd",
    description: "Remove all untracked files and folders.",
    handler: "ResetManager.cleanUntracked",
  },
];
