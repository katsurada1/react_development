/**
 * @flow
 */
'use strict';

import { TypeOfMode } from './ReactTypeOfMode';

export type Fiber = {
  // Bitfield that describes properties about the fiber and its subtree. E.g.
  // the ConcurrentMode flag indicates whether the subtree should be async-by-
  // default. When a fiber is created, it inherits the mode of its
  // parent. Additional flags can be set at creation time, but after that the
  // value should remain unchanged throughout the fiber's lifetime, particularly
  // before its child fibers are created.
  mode: TypeOfMode;

  // A queue of state updates and callbacks.
  updateQueue: any;
};

type BaseFiberRootProperties = {
  // Any additional information from the host associated with this root.
  containerInfo: any;
  // The currently active root fiber. This is the mutable root of the tree.
  current: Fiber;
};

export type FiberRoot = BaseFiberRootProperties;
