import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockInquirer } from "../mocks/inquirerMock";
import { GitExecutor } from "@/core/GitExecutor";

// Mock execSync BEFORE importing the manager
vi.mock('child_process', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...(actual || {}),
    execSync: vi.fn(),
    // ensure `exec` is available for modules that import it (GitExecutor)
    exec: actual?.exec ?? vi.fn(),
    // Mock spawn for GitExecutor.run
    spawn: vi.fn(),
  } as any;
});

import { execSync } from "child_process";

describe("HistoryManager – Full Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------
  // showHistoryGraph()
  // --------------------------------------------------------------
  it("should run git log with chosen format (compact)", async () => {
    mockInquirer({ format: "--oneline" });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { HistoryManager } = await import("@/managers");
    await HistoryManager.showHistoryGraph();

    expect(spy).toHaveBeenCalledWith("git log --oneline");
  });

  it("should run git log with chosen format (author/date)", async () => {
    mockInquirer({ format: "--pretty=format:'%h - %an, %ar : %s'" });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { HistoryManager } = await import("@/managers");
    await HistoryManager.showHistoryGraph();

    expect(spy).toHaveBeenCalledWith("git log --pretty=format:'%h - %an, %ar : %s'");
  });

  // --------------------------------------------------------------
  // showReflog()
  // --------------------------------------------------------------
  it("should run git reflog", async () => {
    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { HistoryManager } = await import("@/managers");
    await HistoryManager.showReflog();

    expect(spy).toHaveBeenCalledWith("git reflog --date=relative");
  });

  // --------------------------------------------------------------
  // showCommitDetails()
  // --------------------------------------------------------------
  it("should not show commit details when no commits", async () => {
    execSync.mockReturnValue(""); // getRecentCommits returns empty

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();
    const { HistoryManager } = await import("@/managers");

    await HistoryManager.showCommitDetails();

    expect(spy).not.toHaveBeenCalled();
  });

  it("should show commit details for selected commit", async () => {
    // Simulate git log --oneline output
    execSync.mockReturnValue("abc123 First commit\nbcd234 Second commit\n");

    mockInquirer({ commit: "bcd234 Second commit" });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();
    const { HistoryManager } = await import("@/managers");

    await HistoryManager.showCommitDetails();

    expect(spy).toHaveBeenCalledWith("git show bcd234 --stat");
  });

  // --------------------------------------------------------------
  // compareCommits()
  // --------------------------------------------------------------
  it("should not compare when less than two commits", async () => {
    execSync.mockReturnValue("onlyonecommit\n");

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();
    const { HistoryManager } = await import("@/managers");

    await HistoryManager.compareCommits();

    expect(spy).not.toHaveBeenCalled();
  });

  it("should compare two selected commits", async () => {
    // Provide at least two commits
    execSync.mockReturnValue(
      "a1aaaaa Commit A\nb2bbbbb Commit B\nc3ccccc Commit C\n"
    );

    mockInquirer({ commit1: "a1aaaaa Commit A" });
    mockInquirer({ commit2: "c3ccccc Commit C" });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();
    const { HistoryManager } = await import("@/managers");

    await HistoryManager.compareCommits();

    expect(spy).toHaveBeenCalledWith("git diff a1aaaaa c3ccccc");
  });

  // --------------------------------------------------------------
  // showDiff()
  // --------------------------------------------------------------
  it("should run git diff for working directory", async () => {
    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();
    const { HistoryManager } = await import("@/managers");

    await HistoryManager.showDiff();

    expect(spy).toHaveBeenCalledWith("git diff");
  });

  // --------------------------------------------------------------
  // showFileDiff()
  // --------------------------------------------------------------
  it("should not show file diff when no tracked files", async () => {
    execSync.mockReturnValue(""); // getTrackedFiles returns empty

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();
    const { HistoryManager } = await import("@/managers");

    await HistoryManager.showFileDiff();

    expect(spy).not.toHaveBeenCalled();
  });

  it("should show file diff for selected file", async () => {
    execSync.mockReturnValue("src/index.js\nlib/util.js\n");

    mockInquirer({ file: "lib/util.js" });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();
    const { HistoryManager } = await import("@/managers");

    await HistoryManager.showFileDiff();

    expect(spy).toHaveBeenCalledWith("git diff lib/util.js");
  });

  // --------------------------------------------------------------
  // showFileHistory()
  // --------------------------------------------------------------
  it("should not show file history when no tracked files", async () => {
    execSync.mockReturnValue("");

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();
    const { HistoryManager } = await import("@/managers");

    await HistoryManager.showFileHistory();

    expect(spy).not.toHaveBeenCalled();
  });

  it("should show file history for selected file", async () => {
    execSync.mockReturnValue("README.md\nsrc/app.js\n");

    mockInquirer({ file: "README.md" });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();
    const { HistoryManager } = await import("@/managers");

    await HistoryManager.showFileHistory();

    expect(spy).toHaveBeenCalledWith(
      "git log --oneline --graph --decorate -- README.md"
    );
  });

  // --------------------------------------------------------------
  // blameFile()
  // --------------------------------------------------------------
  it("should not run blame when no tracked files", async () => {
    execSync.mockReturnValue("");

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();
    const { HistoryManager } = await import("@/managers");

    await HistoryManager.blameFile();

    expect(spy).not.toHaveBeenCalled();
  });

  it("should run git blame for selected file", async () => {
    execSync.mockReturnValue("index.js\nhelper.js\n");

    mockInquirer({ file: "helper.js" });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();
    const { HistoryManager } = await import("@/managers");

    await HistoryManager.blameFile();

    expect(spy).toHaveBeenCalledWith("git blame helper.js");
  });

  // --------------------------------------------------------------
  // showAuthorSummary()
  // --------------------------------------------------------------
  it("should run shortlog to generate author summary", async () => {
    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();
    const { HistoryManager } = await import("@/managers");

    await HistoryManager.showAuthorSummary();

    expect(spy).toHaveBeenCalledWith("git shortlog -sn --all");
  });
});
