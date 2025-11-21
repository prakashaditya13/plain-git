import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GitExecutor } from '@/core/GitExecutor';
import { mockInquirer } from '../mocks/inquirerMock';

// Mock execSync BEFORE importing TagManager
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
import type { Mock } from 'vitest';

describe('TagManager – Full Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------
  // 1️⃣ listTags()
  // --------------------------------------------------------------
  it('should list all tags', async () => {
    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { TagManager } = await import('@/managers');

    await TagManager.listTags();

    expect(spy).toHaveBeenCalledWith('git tag --list');
  });

  // --------------------------------------------------------------
  // 2️⃣ createTag()
  // --------------------------------------------------------------
  it('should create a lightweight tag', async () => {
    mockInquirer({ tagName: 'v1.0.0' });

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { TagManager } = await import('@/managers');

    await TagManager.createTag();

    expect(spy).toHaveBeenCalledWith('git tag v1.0.0');
  });

  // --------------------------------------------------------------
  // 3️⃣ createAnnotatedTag()
  // --------------------------------------------------------------
  it('should create an annotated tag', async () => {
    mockInquirer({ tagName: 'v1.0.0', message: 'Release version 1' });

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { TagManager } = await import('@/managers');

    await TagManager.createAnnotatedTag();

    expect(spy).toHaveBeenCalledWith(`git tag -a v1.0.0 -m "Release version 1"`);
  });

  // --------------------------------------------------------------
  // 4️⃣ showTagDetails()
  it('should NOT show tag details when no tags exist', async () => {
    (execSync as Mock).mockReturnValue('');

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { TagManager } = await import('@/managers');

    await TagManager.showTagDetails();

    expect(spy).not.toHaveBeenCalled();
  });
  it('should show details of selected tag', async () => {
    (execSync as Mock).mockReturnValue('v1.0.0\nbeta\nalpha');

    mockInquirer({ tag: 'beta' });

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { TagManager } = await import('@/managers');

    await TagManager.showTagDetails();

    expect(spy).toHaveBeenCalledWith('git show beta');
  });

  // --------------------------------------------------------------
  // 5️⃣ deleteTag()
  it('should NOT delete when no tags exist', async () => {
    (execSync as Mock).mockReturnValue('');

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { TagManager } = await import('@/managers');

    await TagManager.deleteTag();

    expect(spy).not.toHaveBeenCalled();
  });
  it('should cancel delete when user rejects confirm', async () => {
    (execSync as Mock).mockReturnValue('v1.0.0');

    mockInquirer({ tag: 'v1.0.0' });
    mockInquirer({ confirm: false }); // cancel

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { TagManager } = await import('@/managers');

    await TagManager.deleteTag();

    expect(spy).not.toHaveBeenCalled();
  });
  it('should delete tag when confirmed', async () => {
    (execSync as Mock).mockReturnValue('v1.0.0\nv2.0.0');

    mockInquirer({ tag: 'v2.0.0' });
    mockInquirer({ confirm: true });

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { TagManager } = await import('@/managers');

    await TagManager.deleteTag();

    expect(spy).toHaveBeenCalledWith('git tag -d v2.0.0');
  });

  // --------------------------------------------------------------
  // 6️⃣ pushTags()
  // --------------------------------------------------------------
  it('should push all tags', async () => {
    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { TagManager } = await import('@/managers');

    await TagManager.pushTags();

    expect(spy).toHaveBeenCalledWith('git push --tags');
  });

  // --------------------------------------------------------------
  // 7️⃣ pushSingleTag()
  it('should NOT push single tag when none exist', async () => {
    (execSync as Mock).mockReturnValue('');

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { TagManager } = await import('@/managers');

    await TagManager.pushSingleTag();

    expect(spy).not.toHaveBeenCalled();
  });
  it('should push selected tag to origin', async () => {
    (execSync as Mock).mockReturnValue('v1.0.0\nbeta');

    mockInquirer({ tag: 'beta' });

    const spy = vi.spyOn(GitExecutor, 'run').mockResolvedValue();

    const { TagManager } = await import('@/managers');

    await TagManager.pushSingleTag();

    expect(spy).toHaveBeenCalledWith('git push origin beta');
  });
});
