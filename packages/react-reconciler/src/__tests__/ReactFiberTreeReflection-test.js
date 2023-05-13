import { getNearestMountedFiber } from '../ReactFiberTreeReflection';
import { createHostRootFiber } from '../ReactFiber';
import { ConcurrentRoot } from 'react-reconciler/src/ReactRootTags';

test('getNearestMountedFiber', () => {
  const fiber = createHostRootFiber(ConcurrentRoot);
  expect(getNearestMountedFiber(fiber)).toBe(null);
});
