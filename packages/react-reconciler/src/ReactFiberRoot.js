/**
 * @flow
 */
'use strict';

import { createHostRootFiber } from './ReactFiber';
import { initializeUpdateQueue } from './ReactFiberClassUpdateQueue';
import { FiberRoot } from './ReactInternalTypes';
import { RootTag } from './ReactRootTags';

function FiberRootNode(containerInfo) {
  this.containerInfo = containerInfo;
}

export function createFiberRoot(containerInfo, tag: RootTag): FiberRoot {
  const root: FiberRoot = new FiberRootNode(containerInfo);
  const uninitializedFiber = createHostRootFiber(tag);
  root.current = uninitializedFiber;
  initializeUpdateQueue(uninitializedFiber);

  return root;
}
