import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockInquirer } from "../mocks/inquirerMock";
import { GitExecutor } from "@/core/GitExecutor";
import * as fs from "fs";

// MOCK FS + EXEC BEFORE IMPORT
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

// Mock `fs` so we can stub `existsSync` in tests
// Node's fs is a CommonJS module, so we need to mock both default and named exports
vi.mock("fs", async () => {
  const actual = await vi.importActual<typeof import("fs")>("fs");
  const mockExistsSync = vi.fn(() => false);
  return {
    ...actual,
    default: {
      ...actual,
      existsSync: mockExistsSync,
    },
    existsSync: mockExistsSync,
  };
});

import { execSync } from "child_process";

describe("MergeManager – Full Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fs.existsSync mock to default (false)
    (fs.existsSync as any).mockReturnValue(false);
  });

  // --------------------------------------------------------------
  // 1️⃣ mergeBranch()
  // --------------------------------------------------------------
  it("should block merge if a merge is already in progress", async () => {
    (fs.existsSync as any).mockImplementation((path: string) => {
      return path.includes("MERGE_HEAD");
    });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { MergeManager } = await import("@/managers");

    await MergeManager.mergeBranch();

    expect(spy).not.toHaveBeenCalled();
  });

  it("should do nothing if no branches available", async () => {
    (fs.existsSync as any).mockImplementation((path: string) => {
      return false; // no merge active
    });
    (execSync as any).mockReturnValue(""); // no branches at all

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();
    const { MergeManager } = await import("@/managers");

    await MergeManager.mergeBranch();

    expect(spy).not.toHaveBeenCalled();
  });

  it("should merge target branch successfully WITHOUT conflicts", async () => {
    (fs.existsSync as any).mockImplementation((path: string) => {
      return false; // no merge in progress
    });

    (execSync as any).mockImplementation((cmd: string) => {
      if (cmd.includes("git branch --all")) {
        return "* main\n  feature\n  dev\n";
      }
      if (cmd.includes("git diff --name-only")) {
        return ""; // no conflicts
      }
      return "";
    });

    mockInquirer({ target: "feature" });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { MergeManager } = await import("@/managers");

    await MergeManager.mergeBranch();

    expect(spy).toHaveBeenCalledWith("git merge feature");
  });

  it("should stop after printing conflicts when conflicts exist", async () => {
    (fs.existsSync as any).mockImplementation((path: string) => {
      return false; // no merge in progress
    });

    (execSync as any).mockImplementation((cmd: string) => {
      if (cmd.includes("git branch --all")) {
        return "main\nfeature";
      }
      if (cmd.includes("git diff --name-only")) {
        return "file1.js\nfile2.ts";
      }
      return "";
    });

    mockInquirer({ target: "main" });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { MergeManager } = await import("@/managers");

    await MergeManager.mergeBranch();

    expect(spy).toHaveBeenCalledWith("git merge main");
    // DO NOT continue to success message
  });

  // --------------------------------------------------------------
  // 2️⃣ showConflicts()
  // --------------------------------------------------------------
  it("should show no conflicts when none exist", async () => {
    (execSync as any).mockImplementation((cmd: string) => {
      if (cmd.includes("git diff --name-only --diff-filter=U")) {
        return "";
      }
      return "";
    });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { MergeManager } = await import("@/managers");

    await MergeManager.showConflicts();

    expect(spy).not.toHaveBeenCalled(); // no git calls
  });

  it("should show conflict files when they exist", async () => {
    (execSync as any).mockImplementation((cmd: string) => {
      if (cmd.includes("git diff --name-only --diff-filter=U")) {
        return "a.txt\nb.txt";
      }
      return "";
    });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { MergeManager } = await import("@/managers");

    await MergeManager.showConflicts();

    expect(spy).not.toHaveBeenCalled(); // only prints, no git commands
  });

  // --------------------------------------------------------------
  // 3️⃣ abortMerge()
  // --------------------------------------------------------------
  it("should NOT abort merge when no merge is active", async () => {
    (fs.existsSync as any).mockImplementation((path: string) => {
      return false; // no merge active
    });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();
    const { MergeManager } = await import("@/managers");

    await MergeManager.abortMerge();

    expect(spy).not.toHaveBeenCalled();
  });

  it("should cancel abort when user selects NO", async () => {
    fs.existsSync.mockImplementation((path: string) => {
      return path.includes("MERGE_HEAD");
    });

    mockInquirer({ confirm: false });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { MergeManager } = await import("@/managers");

    await MergeManager.abortMerge();

    expect(spy).not.toHaveBeenCalled();
  });

  it("should abort merge when confirmed", async () => {
    // Reset modules to get fresh import with updated mock
    vi.resetModules();
    
    // Re-import fs to get the mocked version
    const fsMocked = await import("fs");
    (fsMocked.existsSync as any).mockImplementation((path: string) => {
      return typeof path === 'string' && path.includes("MERGE_HEAD");
    });

    mockInquirer({ confirm: true });

    // Re-import GitExecutor after reset and set up spy
    const { GitExecutor: GitExecutorAfterReset } = await import("@/core/GitExecutor");
    const spy = vi.spyOn(GitExecutorAfterReset, "run").mockResolvedValue();

    const { MergeManager } = await import("@/managers");

    await MergeManager.abortMerge();

    expect(spy).toHaveBeenCalledWith("git merge --abort");
  });

  // --------------------------------------------------------------
  // 4️⃣ continueMerge()
  // --------------------------------------------------------------
  it("should not continue merge when merge not active", async () => {
    fs.existsSync.mockImplementation((path: string) => {
      return false; // no merge active
    });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { MergeManager } = await import("@/managers");

    await MergeManager.continueMerge();

    expect(spy).not.toHaveBeenCalled();
  });

  it("should continue merge when merge is active", async () => {
    // Reset modules to get fresh import with updated mock
    vi.resetModules();
    
    // Re-import fs to get the mocked version
    const fsMocked = await import("fs");
    (fsMocked.existsSync as any).mockImplementation((path: string) => {
      return typeof path === 'string' && path.includes("MERGE_HEAD");
    });

    // Re-import GitExecutor after reset and set up spy
    const { GitExecutor: GitExecutorAfterReset } = await import("@/core/GitExecutor");
    const spy = vi.spyOn(GitExecutorAfterReset, "run").mockResolvedValue();

    const { MergeManager } = await import("@/managers");

    await MergeManager.continueMerge();

    expect(spy).toHaveBeenCalledWith("git merge --continue");
  });
});
