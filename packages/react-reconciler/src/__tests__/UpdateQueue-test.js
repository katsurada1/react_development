'use strict';

import { createHostRootFiber } from '../ReactFiber';
import { initializeUpdateQueue } from '../ReactFiberClassUpdateQueue';

test('Dummy UpdateQueue', () => {
  const uninitializedFiber = createHostRootFiber();
  initializeUpdateQueue(uninitializedFiber);
});
