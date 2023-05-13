/**
 * @flow
 */
import { Fiber } from './ReactInternalTypes';
import { ConcurrentMode, NoMode } from './ReactTypeOfMode';
import { Lane, SyncLane } from './ReactFiberLane';

export function requestUpdateLane(fiber: Fiber): Lane {
  // Special cases
  const mode = fiber.mode;
  if ((mode & ConcurrentMode) === NoMode) {
    return SyncLane;
  }

  console.log('Here');
  return SyncLane;
  // else if (
  //   !deferRenderPhaseUpdateToNextBatch &&
  //   (executionContext & RenderContext) !== NoContext &&
  //   workInProgressRootRenderLanes !== NoLanes
  // ) {
  // This is a render phase update. These are not officially supported. The
  // old behavior is to give this the same "thread" (lanes) as
  // whatever is currently rendering. So if you call `setState` on a component
  // that happens later in the same render, it will flush. Ideally, we want to
  // remove the special case and treat them as if they came from an
  // interleaved event. Regardless, this pattern is not officially supported.
  // This behavior is only a fallback. The flag only exists until we can roll
  // out the setState warning, since existing code might accidentally rely on
  // the current behavior.
  //   return pickArbitraryLane(workInProgressRootRenderLanes);
  // }

  // const isTransition = requestCurrentTransition() !== NoTransition;
  // if (isTransition) {
  //   if (__DEV__ && ReactCurrentBatchConfig.transition !== null) {
  //     const transition = ReactCurrentBatchConfig.transition;
  //     if (!transition._updatedFibers) {
  //       transition._updatedFibers = new Set();
  //     }

  //     transition._updatedFibers.add(fiber);
  //   }
  //   // The algorithm for assigning an update to a lane should be stable for all
  //   // updates at the same priority within the same event. To do this, the
  //   // inputs to the algorithm must be the same.
  //   //
  //   // The trick we use is to cache the first of each of these inputs within an
  //   // event. Then reset the cached values once we can be sure the event is
  //   // over. Our heuristic for that is whenever we enter a concurrent work loop.
  //   if (currentEventTransitionLane === NoLane) {
  //     // All transitions within the same event are assigned the same lane.
  //     currentEventTransitionLane = claimNextTransitionLane();
  //   }
  //   return currentEventTransitionLane;
  // }

  // // Updates originating inside certain React methods, like flushSync, have
  // // their priority set by tracking it with a context variable.
  // //
  // // The opaque type returned by the host config is internally a lane, so we can
  // // use that directly.
  // // TODO: Move this type conversion to the event priority module.
  // const updateLane: Lane = (getCurrentUpdatePriority(): any);
  // if (updateLane !== NoLane) {
  //   return updateLane;
  // }

  // // This update originated outside React. Ask the host environment for an
  // // appropriate priority, based on the type of event.
  // //
  // // The opaque type returned by the host config is internally a lane, so we can
  // // use that directly.
  // // TODO: Move this type conversion to the event priority module.
  // const eventLane: Lane = (getCurrentEventPriority(): any);
  // return eventLane;
}
