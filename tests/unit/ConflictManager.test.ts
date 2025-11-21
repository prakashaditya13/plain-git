import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockInquirer } from "@tests/mocks/inquirerMock";
import { GitExecutor } from "@/core/GitExecutor";

// ---------------------------
// Correct fs mock
// ---------------------------
vi.mock("fs", async () => {
  const actual = await vi.importActual<typeof import("fs")>("fs");
  return {
    ...actual,
    existsSync: vi.fn(),
    readFileSync: vi.fn()
  };
});

// ---------------------------
// Correct execSync mock
// ---------------------------
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

describe("ConflictManager – Full Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------
  // 1️⃣ listConflicts()
  // ---------------------------------------------------------
  it("should show no conflicts when none exist", async () => {
    execSync.mockReturnValue("");

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();
    const { ConflictManager } = await import("@/managers");

    await ConflictManager.listConflicts();

    expect(spy).not.toHaveBeenCalled();
  });

  it("should list conflicted files when they exist", async () => {
    execSync.mockReturnValue("fileA.js\nfileB.ts\n");

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();
    const { ConflictManager } = await import("@/managers");

    await ConflictManager.listConflicts();

    expect(spy).not.toHaveBeenCalled(); // listConflicts only prints, no git run
  });

  // ---------------------------------------------------------
  // 2️⃣ inspectConflict()
  // ---------------------------------------------------------
  it("should not inspect when no conflicts exist", async () => {
    execSync.mockReturnValue("");

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();
    const { ConflictManager } = await import("@/managers");

    await ConflictManager.inspectConflict();

    expect(spy).not.toHaveBeenCalled();
  });

  it("should inspect and show conflict markers", async () => {
    execSync.mockReturnValue("conflict.txt");

    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(
      `
line1
<<<<<<< HEAD
your code
=======
their code
>>>>>>> branch
line9
`
    );

    mockInquirer({ file: "conflict.txt" });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();
    const { ConflictManager } = await import("@/managers");

    await ConflictManager.inspectConflict();

    expect(spy).not.toHaveBeenCalled(); // only prints markers
  });

  it("should show message when file has no conflict markers", async () => {
    execSync.mockReturnValue("clean.txt");

    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue("normal content\nno conflict here");

    mockInquirer({ file: "clean.txt" });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { ConflictManager } = await import("@/managers");

    await ConflictManager.inspectConflict();

    expect(spy).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------
  // 3️⃣ openInEditor()
  // ---------------------------------------------------------
  it("should not open editor if no conflicts", async () => {
    execSync.mockReturnValue("");

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();
    const { ConflictManager } = await import("@/managers");

    await ConflictManager.openInEditor();

    expect(spy).not.toHaveBeenCalled();
  });

  it("should open file in VSCode", async () => {
    execSync.mockReturnValue("src/app.js");

    mockInquirer({ file: "src/app.js" });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();
    const { ConflictManager } = await import("@/managers");

    await ConflictManager.openInEditor();

    expect(spy).toHaveBeenCalledWith("code src/app.js");
  });

  // ---------------------------------------------------------
  // 4️⃣ showConflictDiff()
  // ---------------------------------------------------------
  it("should not diff when no conflicts exist", async () => {
    execSync.mockReturnValue("");

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();

    const { ConflictManager } = await import("@/managers");

    await ConflictManager.showConflictDiff();

    expect(spy).not.toHaveBeenCalled();
  });

  it("should show diff for selected file", async () => {
    execSync.mockReturnValue("conflict.txt");

    mockInquirer({ file: "conflict.txt" });

    const spy = vi.spyOn(GitExecutor, "run").mockResolvedValue();
    const { ConflictManager } = await import("@/managers");

    await ConflictManager.showConflictDiff();

    expect(spy).toHaveBeenCalledWith("git diff conflict.txt");
  });

  // ---------------------------------------------------------
  // 5️⃣ conflictHelp()
  // ---------------------------------------------------------
  it("should show help text without errors", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const { ConflictManager } = await import("@/managers");

    await ConflictManager.conflictHelp();

    expect(consoleSpy).toHaveBeenCalled(); // printed help text
  });
});
