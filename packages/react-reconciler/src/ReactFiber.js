/**
 * @flow
 */
import { NoFlags } from './ReactFiberFlags';
import { Fiber } from './ReactInternalTypes';
import { ConcurrentMode, NoMode, TypeOfMode } from './ReactTypeOfMode';
import { ConcurrentRoot } from './ReactRootTags';
import type { RootTag } from './ReactRootTags';
import type { WorkTag } from './ReactWorkTags';

function FiberNode(this: $FlowFixMe, mode: TypeOfMode, tag: WorkTag) {
  // Fiber
  this.mode = mode;
  this.return = null;
  this.tag = tag;
  this.updateQueue = null;

  // Effect
  this.alternate = null;
  this.flags = NoFlags;
}

function createFiber(mode: TypeOfMode, tag: WorkTag): Fiber {
  // $FlowFixMe: the shapes are exact here but Flow doesn't like constructors
  return new FiberNode(mode, tag);
}

export function createHostRootFiber(tag: RootTag) {
  let mode;
  if (tag === ConcurrentRoot) {
    mode = ConcurrentMode;
    // if (isStrictMode === true || createRootStrictEffectsByDefault) {
    //   mode |= StrictLegacyMode | StrictEffectsMode;
    // }
  } else {
    mode = NoMode;
  }

  return createFiber(mode, tag);
}
