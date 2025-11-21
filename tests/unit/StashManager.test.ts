import { describe, it, expect, beforeEach, vi } from "vitest";
import { GitExecutor } from "@/core/GitExecutor";
import { mockInquirer } from "../mocks/inquirerMock";

// Mock execSync BEFORE importing StashManager
vi.mock('child_process', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...(actual || {}),
    execSync: vi.fn(),
    // ensure `exec` is available for modules that import it (GitExecutor)
    exec: actual?.exec ?? vi.fn(),
  } as any;
});


import { execSync } from "child_process";

describe("StashManager – Full Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----------------------------------------------------------
  // 1️⃣ createStash()
  // ----------------------------------------------------------
  it("should create stash WITHOUT message", async () => {
    mockInquirer({ message: "   " }); // empty message

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { StashManager } = await import("@/managers");

    await StashManager.createStash();

    expect(spy).toHaveBeenCalledWith("git stash push");
  });

  it("should create stash WITH message", async () => {
    mockInquirer({ message: "My stash" });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { StashManager } = await import("@/managers");

    await StashManager.createStash();

    expect(spy).toHaveBeenCalledWith(`git stash push -m "My stash"`);
  });

  // ----------------------------------------------------------
  // 2️⃣ listStashes()
  // ----------------------------------------------------------
  it("should list stash entries", async () => {
    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { StashManager } = await import("@/managers");

    await StashManager.listStashes();

    expect(spy).toHaveBeenCalledWith("git stash list");
  });

  // ----------------------------------------------------------
  // 3️⃣ applyStash()
  // ----------------------------------------------------------
  it("should NOT apply stash if none exist", async () => {
    (execSync as any).mockReturnValue("");

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { StashManager } = await import("@/managers");

    await StashManager.applyStash();

    expect(spy).not.toHaveBeenCalled();
  });

  it("should apply selected stash", async () => {
    (execSync as any).mockReturnValue(
      "stash@{0}: WIP on main: abc123 first stash\nstash@{1}: WIP on dev: xyz987 second stash"
    );

    mockInquirer({ selected: "stash@{1}" });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { StashManager } = await import("@/managers");

    await StashManager.applyStash();

    expect(spy).toHaveBeenCalledWith("git stash apply stash@{1}");
  });

  // ----------------------------------------------------------
  // 4️⃣ popStash()
  // ----------------------------------------------------------
  it("should NOT pop stash if none exist", async () => {
    (execSync as any).mockReturnValue("");

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { StashManager } = await import("@/managers");

    await StashManager.popStash();

    expect(spy).not.toHaveBeenCalled();
  });

  it("should pop selected stash", async () => {
    (execSync as any).mockReturnValue("stash@{0}: WIP on main: initial stash");

    mockInquirer({ selected: "stash@{0}" });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { StashManager } = await import("@/managers");

    await StashManager.popStash();

    expect(spy).toHaveBeenCalledWith("git stash pop stash@{0}");
  });

  // ----------------------------------------------------------
  // 5️⃣ dropStash()
  // ----------------------------------------------------------
  it("should NOT drop if no stashes exist", async () => {
    (execSync as any).mockReturnValue("");

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { StashManager } = await import("@/managers");

    await StashManager.dropStash();

    expect(spy).not.toHaveBeenCalled();
  });

  it("should cancel drop when confirm=false", async () => {
    (execSync as any).mockReturnValue("stash@{0}: test");

    mockInquirer({ selected: "stash@{0}" });
    mockInquirer({ confirm: false }); // user cancels

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { StashManager } = await import("@/managers");

    await StashManager.dropStash();

    expect(spy).not.toHaveBeenCalled();
  });

  it("should drop stash when confirmed", async () => {
    (execSync as any).mockReturnValue("stash@{0}: test stash");

    mockInquirer({ selected: "stash@{0}" });
    mockInquirer({ confirm: true });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { StashManager } = await import("@/managers");

    await StashManager.dropStash();

    expect(spy).toHaveBeenCalledWith("git stash drop stash@{0}");
  });

  // ----------------------------------------------------------
  // 6️⃣ clearStashes()
  // ----------------------------------------------------------
  it("should NOT clear stashes when user cancels", async () => {
    mockInquirer({ confirm: false });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { StashManager } = await import("@/managers");

    await StashManager.clearStashes();

    expect(spy).not.toHaveBeenCalled();
  });

  it("should clear all stashes when confirmed", async () => {
    mockInquirer({ confirm: true });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { StashManager } = await import("@/managers");

    await StashManager.clearStashes();

    expect(spy).toHaveBeenCalledWith("git stash clear");
  });
});
