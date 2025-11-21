
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RepositoryManager } from "@/managers";
import { GitExecutor } from "@/core/GitExecutor";
import { mockInquirer } from "../mocks/inquirerMock";
import { createTestRepo } from "../helpers/testRepo";

describe("RepositoryManager - Full Test Suite", () => {
    beforeEach(() => {
    vi.clearAllMocks();
    });

  // -------------------------------------------------------------
  // 🏗 initRepo()
  // -------------------------------------------------------------
  it("should initialize a standard repo", async () => {
    const repo = createTestRepo();
    process.chdir(repo);

    mockInquirer({ bare: false });

    const {RepositoryManager} = await import("@/managers")

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    await RepositoryManager.initRepo();

    expect(spy).toHaveBeenCalledWith("git init");
  });

  it("should initialize a bare repo", async () => {
    const repo = createTestRepo();
    process.chdir(repo);

    mockInquirer({ bare: true });

    const {RepositoryManager} = await import("@/managers")

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    await RepositoryManager.initRepo();

    expect(spy).toHaveBeenCalledWith("git init --bare");
  });

  // -------------------------------------------------------------
  // 🌐 cloneRepo()
  // -------------------------------------------------------------
  it("should clone repo without folder", async () => {
    mockInquirer({
      url: "https://github.com/aditya/repo",
      folder: ""
    });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    await RepositoryManager.cloneRepo();

    expect(spy).toHaveBeenCalledWith("git clone https://github.com/aditya/repo");
  });

  it("should clone repo with target folder", async () => {
    mockInquirer({
      url: "https://github.com/aditya/repo",
      folder: "my-folder"
    });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    await RepositoryManager.cloneRepo();

    expect(spy).toHaveBeenCalledWith("git clone https://github.com/aditya/repo my-folder");
  });

  // -------------------------------------------------------------
  // 📂 status()
  // -------------------------------------------------------------
  it("should run short status", async () => {
    mockInquirer({ short: true });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    await RepositoryManager.status();

    expect(spy).toHaveBeenCalledWith("git status -s");
  });

  it("should run full status", async () => {
    mockInquirer({ short: false });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    await RepositoryManager.status();

    expect(spy).toHaveBeenCalledWith("git status");
  });

  // -------------------------------------------------------------
  // ⚙️ showConfig()
  // -------------------------------------------------------------
  it("should show local config", async () => {
    mockInquirer({ scope: "--local" });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    await RepositoryManager.showConfig();

    expect(spy).toHaveBeenCalledWith("git config --local --list");
  });

  it("should show global config", async () => {
    mockInquirer({ scope: "--global" });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    await RepositoryManager.showConfig();

    expect(spy).toHaveBeenCalledWith("git config --global --list");
  });

  it("should show system config", async () => {
    mockInquirer({ scope: "--system" });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    await RepositoryManager.showConfig();

    expect(spy).toHaveBeenCalledWith("git config --system --list");
  });

  it("should list all configs", async () => {
    mockInquirer({ scope: "--list" });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    await RepositoryManager.showConfig();

    expect(spy).toHaveBeenCalledWith("git config --list");
  });

  // -------------------------------------------------------------
  // ✏️ setConfig()
  // -------------------------------------------------------------
  it("should set local config", async () => {
    mockInquirer({
      key: "user.name",
      value: "Aditya",
      global: false
    });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    await RepositoryManager.setConfig();

    expect(spy).toHaveBeenCalledWith(`git config  user.name "Aditya"`);
  });

  it("should set global config", async () => {
    mockInquirer({
      key: "user.email",
      value: "test@example.com",
      global: true
    });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    await RepositoryManager.setConfig();

    expect(spy).toHaveBeenCalledWith(`git config --global user.email "test@example.com"`);
  });

  // -------------------------------------------------------------
  // 🔗 listRemotes()
  // -------------------------------------------------------------
  it("should list remotes", async () => {
    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    await RepositoryManager.listRemotes();

    expect(spy).toHaveBeenCalledWith("git remote -v");
  });

  // -------------------------------------------------------------
  // ➕ addRemote()
  // -------------------------------------------------------------
  it("should add a remote", async () => {
    mockInquirer({
      name: "origin",
      url: "https://github.com/aditya/plain-git"
    });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    await RepositoryManager.addRemote();

    expect(spy).toHaveBeenCalledWith("git remote add origin https://github.com/aditya/plain-git");
  });

  // -------------------------------------------------------------
  // ✏️ updateRemote()
  // -------------------------------------------------------------
  it("should update a remote", async () => {
    mockInquirer({
      name: "origin",
      url: "https://github.com/aditya/new-url"
    });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    await RepositoryManager.updateRemote();

    expect(spy).toHaveBeenCalledWith("git remote set-url origin https://github.com/aditya/new-url");
  });

  // -------------------------------------------------------------
  // 🗑️ removeRemote()
  // -------------------------------------------------------------
  it("should remove a remote", async () => {
    mockInquirer({ name: "origin" });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    await RepositoryManager.removeRemote();

    expect(spy).toHaveBeenCalledWith("git remote remove origin");
  });

  // -------------------------------------------------------------
  // 🧠 showRepoInfo()
  // -------------------------------------------------------------
  it("should show repo info", async () => {
    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    await RepositoryManager.showRepoInfo();

    expect(spy).toHaveBeenCalledWith("git rev-parse --show-toplevel && git rev-parse --abbrev-ref HEAD");
  });

  // -------------------------------------------------------------
  // 🧹 optimizeRepo()
  // -------------------------------------------------------------
  it("should optimize the repo", async () => {
    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    await RepositoryManager.optimizeRepo();

    expect(spy).toHaveBeenCalledWith("git gc --prune=now --aggressive");
  });

  // -------------------------------------------------------------
  // 🧾 verifyRepo()
  // -------------------------------------------------------------
  it("should verify repo integrity", async () => {
    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    await RepositoryManager.verifyRepo();

    expect(spy).toHaveBeenCalledWith("git fsck --full --progress");
  });
});
