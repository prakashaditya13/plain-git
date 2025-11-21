import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GitExecutor } from '@/core/GitExecutor';
import { mockInquirer, clearInquirerQueue } from '../mocks/inquirerMock';

// Mock execSync BEFORE importing RemoteManager
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

describe('RemoteManager – Full Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearInquirerQueue();
  });

  // --------------------------------------------------------------
  // 1️⃣ listRemotes()
  // --------------------------------------------------------------
  it('should list remotes', async () => {
    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { RemoteManager } = await import('@/managers');

    await RemoteManager.listRemotes();

    expect(spy).toHaveBeenCalledWith('git remote -v');
  });

  // --------------------------------------------------------------
  // 2️⃣ addRemote()
  // --------------------------------------------------------------
  it('should add a remote', async () => {
    mockInquirer({ name: 'origin', url: 'https://github.com/test/repo' });

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { RemoteManager } = await import('@/managers');

    await RemoteManager.addRemote();

    expect(spy).toHaveBeenCalledWith('git remote add origin https://github.com/test/repo');
  });

  // --------------------------------------------------------------
  // 3️⃣ renameRemote()
  // --------------------------------------------------------------
  it('should rename a remote', async () => {
    (execSync as any).mockReturnValue('origin\nbackup');

    mockInquirer({ oldName: 'origin' });
    mockInquirer({ newName: 'main-origin' });

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { RemoteManager } = await import('@/managers');

    await RemoteManager.renameRemote();

    expect(spy).toHaveBeenCalledWith('git remote rename origin main-origin');
  });

  it('should not rename if no remotes exist', async () => {
    (execSync as any).mockReturnValue('');

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { RemoteManager } = await import('@/managers');

    await RemoteManager.renameRemote();

    expect(spy).not.toHaveBeenCalled();
  });

  // --------------------------------------------------------------
  // 4️⃣ removeRemote()
  // --------------------------------------------------------------
  it('should remove remote', async () => {
    (execSync as any).mockReturnValue('origin\nbackup');

    mockInquirer({ name: 'backup' });

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { RemoteManager } = await import('@/managers');

    await RemoteManager.removeRemote();

    expect(spy).toHaveBeenCalledWith('git remote remove backup');
  });

  it('should not remove if no remotes', async () => {
    (execSync as any).mockReturnValue('');

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { RemoteManager } = await import('@/managers');

    await RemoteManager.removeRemote();

    expect(spy).not.toHaveBeenCalled();
  });

  // --------------------------------------------------------------
  // 5️⃣ updateRemoteUrl()
  // --------------------------------------------------------------
  it('should update remote URL', async () => {
    (execSync as any).mockReturnValue('origin');

    mockInquirer({ name: 'origin' });
    mockInquirer({ url: 'https://github.com/new/url' });

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { RemoteManager } = await import('@/managers');

    await RemoteManager.updateRemoteUrl();

    expect(spy).toHaveBeenCalledWith('git remote set-url origin https://github.com/new/url');
  });

  // --------------------------------------------------------------
  // 6️⃣ pushChanges()
  // --------------------------------------------------------------
  it('should ask for remote URL and perform first push when NO remotes exist', async () => {
    // No remotes in repo
    (execSync as any).mockReturnValueOnce(''); // getRemoteList()

    // User enters remote URL
    mockInquirer({ url: 'https://github.com/test/repo.git' });

    const executorSpy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { RemoteManager } = await import('@/managers');

    // Mock: detecting currentBranch
    (execSync as any).mockReturnValueOnce('main'); // current branch
    (execSync as any).mockImplementationOnce(() => {
      throw new Error();
    }); // no upstream

    await RemoteManager.pushChanges();

    expect(executorSpy).toHaveBeenCalledWith(
      'git remote add origin https://github.com/test/repo.git',
    );

    expect(executorSpy).toHaveBeenCalledWith('git push -u origin main');
  });

  it('should push with -u when upstream is missing', async () => {
    // Mock remotes exist
    (execSync as any).mockReturnValueOnce('origin\n');

    // No inquirer needed (remote auto-chooses origin)
    mockInquirer({});

    const executorSpy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { RemoteManager } = await import('@/managers');

    // Mock branch name
    (execSync as any).mockReturnValueOnce('dev'); // current branch

    // Mock: upstream missing -> execSync throws
    (execSync as any).mockImplementationOnce(() => {
      throw new Error('No upstream');
    });

    await RemoteManager.pushChanges();

    expect(executorSpy).toHaveBeenCalledWith('git push -u origin dev');
  });

  it('should perform normal push when upstream exists', async () => {
    // Remote present
    (execSync as any).mockReturnValueOnce('origin\n');

    // No prompts necessary
    mockInquirer({});

    const executorSpy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { RemoteManager } = await import('@/managers');

    // Mock branch = main
    (execSync as any).mockReturnValueOnce('main');

    // Mock upstream exists (does NOT throw)
    (execSync as any).mockReturnValueOnce('origin/main');

    await RemoteManager.pushChanges();

    expect(executorSpy).toHaveBeenCalledWith('git push');
  });

  // If no remotes → ask for URL, add remote, then push
  it('should push to origin when no remotes exist', async () => {
    mockInquirer({ url: 'https://github.com/test/repo.git' });
    
    // Mock execSync calls in order:
    // 1. getRemoteList() -> execSync('git remote') -> returns ''
    // 2. pushChanges() -> execSync('git rev-parse --abbrev-ref HEAD') -> returns 'main'
    // 3. pushChanges() -> execSync('git rev-parse --abbrev-ref --symbolic-full-name @{u}') -> throws
    (execSync as any)
      .mockReturnValueOnce('') // getRemoteList() - no remotes
      .mockReturnValueOnce('main') // current branch
      .mockImplementationOnce(() => {
        throw new Error(); // no upstream
      });

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();
    const { RemoteManager } = await import('@/managers');

    await RemoteManager.pushChanges();

    expect(spy).toHaveBeenCalledWith('git remote add origin https://github.com/test/repo.git');
    expect(spy).toHaveBeenCalledWith('git push -u origin main');
  });

  // --------------------------------------------------------------
  // 7️⃣ pushWithUpstream()
  // --------------------------------------------------------------
  it('should push with upstream', async () => {
    (execSync as any).mockReturnValue('origin');

    // pushWithUpstream uses a single prompt with array of 2 questions
    mockInquirer({ remote: 'origin', branch: 'dev' });

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { RemoteManager } = await import('@/managers');

    await RemoteManager.pushWithUpstream();

    expect(spy).toHaveBeenCalledWith('git push -u origin dev');
  });

  // --------------------------------------------------------------
  // 8️⃣ pullChanges()
  // --------------------------------------------------------------
  it('should pull from selected remote', async () => {
    (execSync as any).mockReturnValue('origin\nteam');

    mockInquirer({ remote: 'team' });

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();
    const { RemoteManager } = await import('@/managers');

    await RemoteManager.pullChanges();

    expect(spy).toHaveBeenCalledWith('git pull team');
  });

  // --------------------------------------------------------------
  // 9️⃣ fetchUpdates()
  // --------------------------------------------------------------
  it('should fetch from selected remote', async () => {
    (execSync as any).mockReturnValue('origin\ntest');

    mockInquirer({ remote: 'test' });

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();
    const { RemoteManager } = await import('@/managers');

    await RemoteManager.fetchUpdates();

    expect(spy).toHaveBeenCalledWith('git fetch test');
  });

  it("should fetch --all when user selects 'all'", async () => {
    (execSync as any).mockReturnValue('origin\nteam');

    mockInquirer({ remote: 'all' });

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();
    const { RemoteManager } = await import('@/managers');

    await RemoteManager.fetchUpdates();

    expect(spy).toHaveBeenCalledWith('git fetch --all');
  });

  // --------------------------------------------------------------
  // 🔟 showRemoteInfo()
  // --------------------------------------------------------------
  it('should show remote info', async () => {
    (execSync as any).mockReturnValue('origin\nbackup');

    mockInquirer({ remote: 'backup' });

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();
    const { RemoteManager } = await import('@/managers');

    await RemoteManager.showRemoteInfo();

    expect(spy).toHaveBeenCalledWith('git remote show backup');
  });

  it('should do nothing if no remotes exist', async () => {
    (execSync as any).mockReturnValue('');

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();
    const { RemoteManager } = await import('@/managers');

    await RemoteManager.showRemoteInfo();

    expect(spy).not.toHaveBeenCalled();
  });

  // --------------------------------------------------------------
  // 1️⃣1️⃣ syncAll()
  // --------------------------------------------------------------
  it('should sync all remotes', async () => {
    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { RemoteManager } = await import('@/managers');

    await RemoteManager.syncAll();

    expect(spy).toHaveBeenCalledWith('git fetch --all && git pull --all');
  });
});
