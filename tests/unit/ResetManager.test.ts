import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockInquirer } from "@tests/mocks/inquirerMock";
import { GitExecutor } from "@/core/GitExecutor";

// Mock child_process.execSync before importing the manager
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

describe("ResetManager – Full Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------
  // undoLastCommitSoft()
  // -------------------------------------------------------------
  it("should perform a soft undo of last commit", async () => {
    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { ResetManager } = await import("@/managers");
    await ResetManager.undoLastCommitSoft();

    expect(spy).toHaveBeenCalledWith("git reset --soft HEAD~1");
  });

  // -------------------------------------------------------------
  // undoLastCommitMixed()
  // -------------------------------------------------------------
  it("should perform a mixed undo of last commit", async () => {
    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { ResetManager } = await import("@/managers");
    await ResetManager.undoLastCommitMixed();

    expect(spy).toHaveBeenCalledWith("git reset --mixed HEAD~1");
  });

  // -------------------------------------------------------------
  // undoLastCommitHard()
  // -------------------------------------------------------------
  it("should cancel hard undo when user rejects confirmation", async () => {
    mockInquirer({ confirm: false });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { ResetManager } = await import("@/managers");
    await ResetManager.undoLastCommitHard();

    expect(spy).not.toHaveBeenCalled();
  });

  it("should perform hard undo when user confirms", async () => {
    mockInquirer({ confirm: true });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { ResetManager } = await import("@/managers");
    await ResetManager.undoLastCommitHard();

    expect(spy).toHaveBeenCalledWith("git reset --hard HEAD~1");
  });

  // -------------------------------------------------------------
  // resetToSpecificCommit()
  // -------------------------------------------------------------
  it("should do nothing when no recent commits exist", async () => {
    (execSync as unknown as vi.Mock).mockReturnValue("");

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { ResetManager } = await import("@/managers");
    await ResetManager.resetToSpecificCommit();

    expect(spy).not.toHaveBeenCalled();
  });

  it("should reset to chosen commit with chosen mode", async () => {
    // simulate git log --oneline output
    (execSync as unknown as vi.Mock).mockReturnValue("abc123 First\nbcd234 Second\n");

    mockInquirer({ commit: "bcd234 Second" });
    mockInquirer({ mode: "--mixed" });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { ResetManager } = await import("@/managers");
    await ResetManager.resetToSpecificCommit();

    expect(spy).toHaveBeenCalledWith("git reset --mixed bcd234");
  });

  // -------------------------------------------------------------
  // discardFileChanges()
  // -------------------------------------------------------------
  it("should do nothing when no modified files exist", async () => {
    (execSync as unknown as vi.Mock).mockReturnValue("");

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { ResetManager } = await import("@/managers");
    await ResetManager.discardFileChanges();

    expect(spy).not.toHaveBeenCalled();
  });

  it("should not discard when user selects none", async () => {
    (execSync as unknown as vi.Mock).mockReturnValue(" M a.js\n M b.js");

    mockInquirer({ selected: [] }); // user selects none

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { ResetManager } = await import("@/managers");
    await ResetManager.discardFileChanges();

    expect(spy).not.toHaveBeenCalled();
  });

  it("should discard selected files when confirmed", async () => {
    (execSync as unknown as vi.Mock).mockReturnValue(" M a.js\n M b.js");

    mockInquirer({ selected: ["a.js", "b.js"] });
    mockInquirer({ confirm: true });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { ResetManager } = await import("@/managers");
    await ResetManager.discardFileChanges();

    expect(spy).toHaveBeenCalledWith("git restore a.js");
    expect(spy).toHaveBeenCalledWith("git restore b.js");
  });

  // -------------------------------------------------------------
  // cleanUntracked()
  // -------------------------------------------------------------
  it("should cancel cleaning when user rejects", async () => {
    mockInquirer({ confirm: false });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { ResetManager } = await import("@/managers");
    await ResetManager.cleanUntracked();

    expect(spy).not.toHaveBeenCalled();
  });

  it("should clean untracked files when confirmed", async () => {
    mockInquirer({ confirm: true });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { ResetManager } = await import("@/managers");
    await ResetManager.cleanUntracked();

    expect(spy).toHaveBeenCalledWith("git clean -fd");
  });

  // -------------------------------------------------------------
  // interactiveReset()
  // -------------------------------------------------------------
  it("should call undoLastCommitSoft when mode is soft", async () => {
    mockInquirer({ mode: "soft" });

    const { ResetManager } = await import("@/managers");

    const softSpy = vi.spyOn(ResetManager, "undoLastCommitSoft").mockResolvedValue();

    await ResetManager.interactiveReset();

    expect(softSpy).toHaveBeenCalled();
  });

  it("should call undoLastCommitMixed when mode is mixed", async () => {
    mockInquirer({ mode: "mixed" });

    const { ResetManager } = await import("@/managers");

    const mixedSpy = vi.spyOn(ResetManager, "undoLastCommitMixed").mockResolvedValue();

    await ResetManager.interactiveReset();

    expect(mixedSpy).toHaveBeenCalled();
  });

  it("should call undoLastCommitHard when mode is hard", async () => {
    mockInquirer({ mode: "hard" });

    const { ResetManager } = await import("@/managers");

    const hardSpy = vi.spyOn(ResetManager, "undoLastCommitHard").mockResolvedValue();

    await ResetManager.interactiveReset();

    expect(hardSpy).toHaveBeenCalled();
  });

  it("should call resetToSpecificCommit when mode is specific", async () => {
    mockInquirer({ mode: "specific" });

    const { ResetManager } = await import("@/managers");

    const specSpy = vi.spyOn(ResetManager, "resetToSpecificCommit").mockResolvedValue();

    await ResetManager.interactiveReset();

    expect(specSpy).toHaveBeenCalled();
  });

  it("should call discardFileChanges when mode is discard", async () => {
    mockInquirer({ mode: "discard" });

    const { ResetManager } = await import("@/managers");

    const discSpy = vi.spyOn(ResetManager, "discardFileChanges").mockResolvedValue();

    await ResetManager.interactiveReset();

    expect(discSpy).toHaveBeenCalled();
  });

  it("should call cleanUntracked when mode is clean", async () => {
    mockInquirer({ mode: "clean" });

    const { ResetManager } = await import("@/managers");

    const cleanSpy = vi.spyOn(ResetManager, "cleanUntracked").mockResolvedValue();

    await ResetManager.interactiveReset();

    expect(cleanSpy).toHaveBeenCalled();
  });
});
