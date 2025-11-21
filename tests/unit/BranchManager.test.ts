import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockInquirer } from '../mocks/inquirerMock';
import { GitExecutor } from '@/core/GitExecutor';

/**
 * IMPORTANT:
 * We must mock execSync BEFORE importing BranchManager
 */
vi.mock('child_process', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...(actual || {}),
    execSync: vi.fn(),
    // ensure `exec` is available for modules that import it (GitExecutor)
    exec: actual?.exec ?? vi.fn(),
  } as any;
});

// Re-import execSync mock (will refer to the mocked function)
// @ts-ignore - mocked at runtime as a vitest mock
import { execSync } from 'child_process';

describe('BranchManager - Full Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------
  // 1️⃣ createBranch()
  // -------------------------------------------------------------
  it('should create a branch', async () => {
    mockInquirer({ name: 'feature-x' });

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { BranchManager } = await import('@/managers');

    await BranchManager.createBranch();

    expect(spy).toHaveBeenCalledWith('git branch feature-x');
  });

  // -------------------------------------------------------------
  // 2️⃣ createAndSwitch()
  // -------------------------------------------------------------
  it('should create and switch to a new branch', async () => {
    mockInquirer({ name: 'dev-branch' });

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { BranchManager } = await import('@/managers');

    await BranchManager.createAndSwitch();

    expect(spy).toHaveBeenCalledWith(
      'git switch -c dev-branch 2>/dev/null || git checkout -b dev-branch',
    );
  });

  // -------------------------------------------------------------
  // 3️⃣ switchBranch()
  // -------------------------------------------------------------
  it('should switch to a branch', async () => {
    (execSync as any).mockReturnValue('main\nfeature/login');

    mockInquirer({ branch: 'feature/login' });

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { BranchManager } = await import('@/managers');

    await BranchManager.switchBranch();

    expect(spy).toHaveBeenCalledWith(
      'git switch feature/login 2>/dev/null || git checkout feature/login',
    );
  });

  // -------------------------------------------------------------
  // 4️⃣ deleteBranch()
  // -------------------------------------------------------------
  it('should safely delete a branch', async () => {
    (execSync as any).mockReturnValue('main\nfix1');

    mockInquirer({ branch: 'fix1' });
    mockInquirer({ force: false });

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { BranchManager } = await import('@/managers');

    await BranchManager.deleteBranch();

    expect(spy).toHaveBeenCalledWith('git branch -d fix1');
  });

  it('should force delete a branch', async () => {
    (execSync as any).mockReturnValue('main\nfix2');

    mockInquirer({ branch: 'fix2' });
    mockInquirer({ force: true });

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { BranchManager } = await import('@/managers');

    await BranchManager.deleteBranch();

    expect(spy).toHaveBeenCalledWith('git branch -D fix2');
  });

  // -------------------------------------------------------------
  // 5️⃣ renameBranch()
  // -------------------------------------------------------------
  it('should rename a branch', async () => {
    (execSync as any).mockReturnValue('main\nold-name');

    mockInquirer({ branch: 'old-name' });
    mockInquirer({ newName: 'new-name' });

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { BranchManager } = await import('@/managers');

    await BranchManager.renameBranch();

    expect(spy).toHaveBeenCalledWith('git branch -m old-name new-name');
  });

  // -------------------------------------------------------------
  // 6️⃣ listBranches()
  // -------------------------------------------------------------
  it('should list all branches', async () => {
    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { BranchManager } = await import('@/managers');

    await BranchManager.listBranches();

    expect(spy).toHaveBeenCalledWith('git branch --all --verbose --no-color');
  });

  // -------------------------------------------------------------
  // 7️⃣ showCurrentBranch()
  // -------------------------------------------------------------
  it('should show current branch', async () => {
    (execSync as any).mockReturnValue('main');

    const loggerInfo = vi.spyOn(console, 'log').mockImplementation(() => {});

    const { BranchManager } = await import('@/managers');

    await BranchManager.showCurrentBranch();

    expect(loggerInfo).toHaveBeenCalled();
  });

  // -------------------------------------------------------------
  // 8️⃣ pushBranch()
  // -------------------------------------------------------------
  it('should push a branch to origin', async () => {
    (execSync as any).mockReturnValue('main\nfeature/payments');

    mockInquirer({ branch: 'feature/payments' });
    mockInquirer({ remote: 'origin' });

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { BranchManager } = await import('@/managers');

    await BranchManager.pushBranch();

    expect(spy).toHaveBeenCalledWith('git push -u origin feature/payments');
  });

  // -------------------------------------------------------------
  // 9️⃣ showAndList()
  // -------------------------------------------------------------
  it('should call showCurrentBranch() then listBranches()', async () => {
    (execSync as any).mockReturnValue('main');

    const runSpy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { BranchManager } = await import('@/managers');

    await BranchManager.showAndList();

    expect(runSpy).toHaveBeenCalledWith('git branch --all --verbose --no-color');
  });
});
