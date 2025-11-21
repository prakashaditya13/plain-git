import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockInquirer } from "../mocks/inquirerMock";
import { GitExecutor } from "@/core/GitExecutor";

/**
 * Properly mock fs by importing actual and overriding existsSync only.
 * Node's fs is a CommonJS module, so we need to mock both default and named exports.
 */
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

import * as fs from "fs";
import { execSync } from "child_process";

describe("RebaseManager – Full Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fs.existsSync mock to default (false)
    (fs.existsSync as unknown as vi.Mock).mockReturnValue(false);
  });

  // -------------------------------------------------------------
  // startRebase()
  // -------------------------------------------------------------
  it("blocks start when a rebase is already in progress", async () => {
    (fs.existsSync as unknown as vi.Mock).mockImplementation((path: string) => {
      return typeof path === 'string' && path.includes("REBASE_HEAD");
    });
    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { RebaseManager } = await import("@/managers");
    await RebaseManager.startRebase();

    expect(spy).not.toHaveBeenCalled();
  });

  it("does nothing when no branches are available", async () => {
    (fs.existsSync as unknown as vi.Mock).mockReturnValue(false);
    (execSync as unknown as vi.Mock).mockReturnValue(""); // no branches

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();
    const { RebaseManager } = await import("@/managers");

    await RebaseManager.startRebase();

    expect(spy).not.toHaveBeenCalled();
  });

  it("rebases onto selected branch when no conflicts", async () => {
    (fs.existsSync as unknown as vi.Mock).mockReturnValue(false);

    // git branch --all returns list; git diff has no conflicts
    (execSync as unknown as vi.Mock).mockImplementation((cmd: string) => {
      if (cmd.includes("git branch --all")) {
        return "* main\n  feature\n  develop\n";
      }
      if (cmd.includes("git diff --name-only")) {
        return ""; // no conflicts
      }
      return "";
    });

    mockInquirer({ onto: "feature" });
    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { RebaseManager } = await import("@/managers");
    await RebaseManager.startRebase();

    expect(spy).toHaveBeenCalledWith("git rebase feature");
  });

  it("prints conflicts when rebase produces conflicts", async () => {
    (fs.existsSync as unknown as vi.Mock).mockReturnValue(false);

    (execSync as unknown as vi.Mock).mockImplementation((cmd: string) => {
      if (cmd.includes("git branch --all")) {
        return "main\nfeature";
      }
      if (cmd.includes("git diff --name-only")) {
        return "file1.js\nfile2.ts";
      }
      return "";
    });

    mockInquirer({ onto: "main" });
    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { RebaseManager } = await import("@/managers");
    await RebaseManager.startRebase();

    expect(spy).toHaveBeenCalledWith("git rebase main");
    // conflicts cause early return — we asserted the merge command ran
  });

  // -------------------------------------------------------------
  // interactiveRebase()
  // -------------------------------------------------------------
  it("starts interactive rebase with provided count", async () => {
    mockInquirer({ count: "3" });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();
    const { RebaseManager } = await import("@/managers");

    await RebaseManager.interactiveRebase();

    expect(spy).toHaveBeenCalledWith("git rebase -i HEAD~3");
  });

  // -------------------------------------------------------------
  // continueRebase()
  // -------------------------------------------------------------
  it("does nothing when no rebase in progress for continue", async () => {
    (fs.existsSync as unknown as vi.Mock).mockReturnValue(false);

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();
    const { RebaseManager } = await import("@/managers");

    await RebaseManager.continueRebase();

    expect(spy).not.toHaveBeenCalled();
  });

  it("continues rebase when in progress", async () => {
    // Reset modules to get fresh import with updated mock
    vi.resetModules();
    
    // Re-import fs to get the mocked version
    const fsMocked = await import("fs");
    (fsMocked.existsSync as any).mockImplementation((path: string) => {
      return typeof path === 'string' && path.includes("REBASE_HEAD");
    });

    // Re-import GitExecutor after reset and set up spy
    const { GitExecutor: GitExecutorAfterReset } = await import("@/core/GitExecutor");
    const spy = vi.spyOn(GitExecutorAfterReset, "run").mockResolvedValue();

    const { RebaseManager } = await import("@/managers");

    await RebaseManager.continueRebase();

    expect(spy).toHaveBeenCalledWith("git rebase --continue");
  });

  // -------------------------------------------------------------
  // skipCommit()
  // -------------------------------------------------------------
  it("does nothing when no rebase in progress for skip", async () => {
    (fs.existsSync as unknown as vi.Mock).mockReturnValue(false);

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();
    const { RebaseManager } = await import("@/managers");

    await RebaseManager.skipCommit();

    expect(spy).not.toHaveBeenCalled();
  });

  it("skips commit when rebase is active", async () => {
    // Reset modules to get fresh import with updated mock
    vi.resetModules();
    
    // Re-import fs to get the mocked version
    const fsMocked = await import("fs");
    (fsMocked.existsSync as any).mockImplementation((path: string) => {
      return typeof path === 'string' && path.includes("REBASE_HEAD");
    });

    // Re-import GitExecutor after reset and set up spy
    const { GitExecutor: GitExecutorAfterReset } = await import("@/core/GitExecutor");
    const spy = vi.spyOn(GitExecutorAfterReset, "run").mockResolvedValue();

    const { RebaseManager } = await import("@/managers");

    await RebaseManager.skipCommit();

    expect(spy).toHaveBeenCalledWith("git rebase --skip");
  });

  // -------------------------------------------------------------
  // abortRebase()
  // -------------------------------------------------------------
  it("does nothing when no rebase in progress for abort", async () => {
    (fs.existsSync as unknown as vi.Mock).mockReturnValue(false);

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();
    const { RebaseManager } = await import("@/managers");

    await RebaseManager.abortRebase();

    expect(spy).not.toHaveBeenCalled();
  });

  it("cancels abort when user rejects", async () => {
    (fs.existsSync as unknown as vi.Mock).mockReturnValue(true);

    mockInquirer({ confirm: false });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();
    const { RebaseManager } = await import("@/managers");

    await RebaseManager.abortRebase();

    expect(spy).not.toHaveBeenCalled();
  });

  it("aborts rebase when confirmed", async () => {
    // Reset modules to get fresh import with updated mock
    vi.resetModules();
    
    // Re-import fs to get the mocked version
    const fsMocked = await import("fs");
    (fsMocked.existsSync as any).mockImplementation((path: string) => {
      return typeof path === 'string' && path.includes("REBASE_HEAD");
    });

    mockInquirer({ confirm: true });

    // Re-import GitExecutor after reset and set up spy
    const { GitExecutor: GitExecutorAfterReset } = await import("@/core/GitExecutor");
    const spy = vi.spyOn(GitExecutorAfterReset, "run").mockResolvedValue();

    const { RebaseManager } = await import("@/managers");

    await RebaseManager.abortRebase();

    expect(spy).toHaveBeenCalledWith("git rebase --abort");
  });

  // -------------------------------------------------------------
  // showConflicts()
  // -------------------------------------------------------------
  it("reports no conflicts when none exist", async () => {
    (execSync as unknown as vi.Mock).mockReturnValue("");

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();
    const { RebaseManager } = await import("@/managers");

    await RebaseManager.showConflicts();

    expect(spy).not.toHaveBeenCalled();
  });

  it("shows conflict files when they exist", async () => {
    (execSync as unknown as vi.Mock).mockReturnValue("a.txt\nb.txt");

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();
    const { RebaseManager } = await import("@/managers");

    await RebaseManager.showConflicts();

    expect(spy).not.toHaveBeenCalled(); // showConflicts only prints conflicts
  });
});
