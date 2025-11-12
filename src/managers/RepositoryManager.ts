/**
 * 🏁 RepositoryManager.ts (Deep Version)
 * -------------------------------------------------------------
 * Handles all repository-level operations including initialization,
 * configuration, inspection, remote management, and maintenance.
 * -------------------------------------------------------------
 */

import inquirer from "inquirer";
import { GitExecutor } from "../core/GitExecutor";
import { Logger } from "../utils/Logger";

export const RepositoryManager = {
  // 🏗 Initialize Repo
  async initRepo() {
    const { bare } = await inquirer.prompt([
      {
        type: "confirm",
        name: "bare",
        message: "Do you want to create a bare repository?",
        default: false,
      },
    ]);

    const cmd = bare ? "git init --bare" : "git init";
    Logger.info(`📦 Initializing repository (${bare ? "bare" : "standard"})...`);
    await GitExecutor.run(cmd);
    Logger.success("✅ Repository initialized successfully!");
  },

  // 🌐 Clone Repo
  async cloneRepo() {
    const { url, folder } = await inquirer.prompt([
      { type: "input", name: "url", message: "Enter repository URL to clone:" },
      { type: "input", name: "folder", message: "Optional: Enter target folder name (leave empty for default):" },
    ]);

    const cmd = folder ? `git clone ${url} ${folder}` : `git clone ${url}`;
    Logger.info(`🔁 Cloning repository from ${url}...`);
    await GitExecutor.run(cmd);
    Logger.success("✅ Repository cloned successfully!");
  },

  // 📂 Check Status
  async status() {
    const { short } = await inquirer.prompt([
      {
        type: "confirm",
        name: "short",
        message: "Show compact (short) status?",
        default: false,
      },
    ]);

    const cmd = short ? "git status -s" : "git status";
    Logger.info("📂 Checking repository status...");
    await GitExecutor.run(cmd);
  },

  // ⚙️ Git Config Management
  async showConfig() {
    const { scope } = await inquirer.prompt([
      {
        type: "list",
        name: "scope",
        message: "Which config scope do you want to view?",
        choices: [
          { name: "Local", value: "--local" },
          { name: "Global", value: "--global" },
          { name: "System", value: "--system" },
          { name: "All combined", value: "--list" },
        ],
      },
    ]);

    const cmd = scope === "--list" ? "git config --list" : `git config ${scope} --list`;
    Logger.info(`⚙️ Showing ${scope.replace("--", "")} configuration...`);
    await GitExecutor.run(cmd);
  },

  // ✏️ Set Config
  async setConfig() {
    const { key, value, global } = await inquirer.prompt([
      { type: "input", name: "key", message: "Enter config key (e.g. user.name):" },
      { type: "input", name: "value", message: "Enter config value:" },
      { type: "confirm", name: "global", message: "Apply globally?", default: false },
    ]);

    const flag = global ? "--global" : "";
    const cmd = `git config ${flag} ${key} "${value}"`;
    Logger.info(`🧩 Setting config: ${key}=${value}`);
    await GitExecutor.run(cmd);
    Logger.success("✅ Configuration updated!");
  },

  // 🔗 List Remotes
  async listRemotes() {
    Logger.info("🔗 Listing remotes...");
    await GitExecutor.run("git remote -v");
  },

  // ➕ Add Remote
  async addRemote() {
    const { name, url } = await inquirer.prompt([
      { type: "input", name: "name", message: "Enter remote name (e.g. origin):" },
      { type: "input", name: "url", message: "Enter remote URL:" },
    ]);

    const cmd = `git remote add ${name} ${url}`;
    Logger.info(`🔗 Adding remote '${name}' -> ${url}`);
    await GitExecutor.run(cmd);
    Logger.success(`✅ Remote '${name}' added successfully!`);
  },

  // ✏️ Change Remote URL
  async updateRemote() {
    const { name, url } = await inquirer.prompt([
      { type: "input", name: "name", message: "Enter remote name to update:" },
      { type: "input", name: "url", message: "Enter new remote URL:" },
    ]);

    const cmd = `git remote set-url ${name} ${url}`;
    Logger.info(`🔄 Updating remote '${name}' to ${url}`);
    await GitExecutor.run(cmd);
    Logger.success("✅ Remote URL updated!");
  },

  // 🗑️ Remove Remote
  async removeRemote() {
    const { name } = await inquirer.prompt([
      { type: "input", name: "name", message: "Enter remote name to remove:" },
    ]);

    const cmd = `git remote remove ${name}`;
    Logger.info(`🗑️ Removing remote '${name}'...`);
    await GitExecutor.run(cmd);
    Logger.success(`✅ Remote '${name}' removed successfully!`);
  },

  // 🧠 Repository Info
  async showRepoInfo() {
    Logger.info("🔍 Getting repository HEAD and root info...");
    await GitExecutor.run("git rev-parse --show-toplevel && git rev-parse --abbrev-ref HEAD");
  },

  // 🧹 Repository Cleanup / Maintenance
  async optimizeRepo() {
    Logger.info("🧹 Running garbage collection...");
    await GitExecutor.run("git gc --prune=now --aggressive");
    Logger.success("✅ Repository optimized successfully!");
  },

  // 🧾 Check Repository Integrity
  async verifyRepo() {
    Logger.info("🔎 Verifying repository integrity...");
    await GitExecutor.run("git fsck --full");
  },
};
