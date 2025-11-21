import { describe, it, beforeEach, expect, vi } from 'vitest';
import { GitExecutor } from '@/core/GitExecutor';
import { mockInquirer } from '../mocks/inquirerMock';

// Mock execSync BEFORE importing CommitManager
vi.mock('child_process', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...(actual || {}),
    execSync: vi.fn(),
    // ensure `exec` is available for modules that import it (GitExecutor)
    exec: actual?.exec ?? vi.fn(),
  } as any;
});

import { execSync } from 'child_process';

describe('CommitManager - Full Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----------------------------------------------
  // stageAll()
  // ----------------------------------------------
  it('should stage all files', async () => {
    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { CommitManager } = await import('@/managers');
    await CommitManager.stageAll();

    expect(spy).toHaveBeenCalledWith('git add .');
  });

  // ----------------------------------------------
  // stageFiles()
  // ----------------------------------------------
  it('should not stage files when none exist', async () => {
    (execSync as any).mockReturnValue('');

    const { CommitManager } = await import('@/managers');

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    await CommitManager.stageFiles();

    expect(spy).not.toHaveBeenCalled();
  });

  it('should not stage when user selects none', async () => {
    (execSync as any).mockReturnValue(' M file1.js\n?? file2.js');

    mockInquirer({ selected: [] });

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { CommitManager } = await import('@/managers');

    await CommitManager.stageFiles();

    expect(spy).not.toHaveBeenCalled();
  });

  it('should stage selected files', async () => {
    (execSync as any).mockReturnValue(' M a.js\n M b.js');

    mockInquirer({ selected: ['a.js', 'b.js'] });

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { CommitManager } = await import('@/managers');

    await CommitManager.stageFiles();

    expect(spy).toHaveBeenCalledWith('git add a.js b.js');
  });

  // ----------------------------------------------
  // unstageFiles()
  // ----------------------------------------------
  it('should unstage selected files', async () => {
    (execSync as any).mockReturnValue(' M a.js\n M b.js');

    mockInquirer({ selected: ['a.js'] });

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { CommitManager } = await import('@/managers');

    await CommitManager.unstageFiles();

    expect(spy).toHaveBeenCalledWith('git restore --staged a.js');
  });

  // ----------------------------------------------
  // commitChanges()
  // ----------------------------------------------
  it('should not commit when empty message', async () => {
    mockInquirer({ message: '   ' });

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { CommitManager } = await import('@/managers');

    await CommitManager.commitChanges();

    expect(spy).not.toHaveBeenCalled();
  });

  it('should commit with message', async () => {
    mockInquirer({ message: 'Initial commit' });

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { CommitManager } = await import('@/managers');

    await CommitManager.commitChanges();

    expect(spy).toHaveBeenCalledWith(`git commit -m "Initial commit"`);
  });

  // ----------------------------------------------
  // amendLastCommit()
  // ----------------------------------------------
  it('should amend last commit', async () => {
    mockInquirer({ message: 'Fix typo' });

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { CommitManager } = await import('@/managers');

    await CommitManager.amendLastCommit();

    expect(spy).toHaveBeenCalledWith(`git commit --amend -m "Fix typo"`);
  });

  // ----------------------------------------------
  // undoLastCommit()
  // ----------------------------------------------
  it('should undo last commit (soft)', async () => {
    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { CommitManager } = await import('@/managers');

    await CommitManager.undoLastCommit();

    expect(spy).toHaveBeenCalledWith('git reset --soft HEAD~1');
  });

  // ----------------------------------------------
  // showLastCommit()
  // ----------------------------------------------
  it('should show last commit', async () => {
    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { CommitManager } = await import('@/managers');

    await CommitManager.showLastCommit();

    expect(spy).toHaveBeenCalledWith('git show HEAD --stat --pretty=medium');
  });

  // ----------------------------------------------
  // showLog()
  // ----------------------------------------------
  it('should show compact log', async () => {
    mockInquirer({ format: '--oneline' });

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { CommitManager } = await import('@/managers');

    await CommitManager.showLog();

    expect(spy).toHaveBeenCalledWith('git log --oneline');
  });

  it('should show detailed log', async () => {
    mockInquirer({ format: '' });

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { CommitManager } = await import('@/managers');

    await CommitManager.showLog();

    expect(spy).toHaveBeenCalledWith('git log ');
  });

  it('should show graph log', async () => {
    mockInquirer({ format: '--oneline --graph --decorate' });

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { CommitManager } = await import('@/managers');

    await CommitManager.showLog();

    expect(spy).toHaveBeenCalledWith('git log --oneline --graph --decorate');
  });

  // ----------------------------------------------
  // showDiff()
  // ----------------------------------------------
  it('should show unstaged diff', async () => {
    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { CommitManager } = await import('@/managers');

    await CommitManager.showDiff();

    expect(spy).toHaveBeenCalledWith('git diff');
  });

  // ----------------------------------------------
  // showStagedDiff()
  // ----------------------------------------------
  it('should show staged diff', async () => {
    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { CommitManager } = await import('@/managers');

    await CommitManager.showStagedDiff();

    expect(spy).toHaveBeenCalledWith('git diff --cached');
  });
});
