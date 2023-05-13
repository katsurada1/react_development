/**
 * @flow
 */
import {
  DiscreteEventPriority,
  ContinuousEventPriority,
  DefaultEventPriority,
  IdleEventPriority,
  getCurrentUpdatePriority,
  setCurrentUpdatePriority,
} from 'react-reconciler/src/ReactEventPriorities';

import {
  getCurrentPriorityLevel as getCurrentSchedulerPriorityLevel,
  IdlePriority as IdleSchedulerPriority,
  ImmediatePriority as ImmediateSchedulerPriority,
  LowPriority as LowSchedulerPriority,
  NormalPriority as NormalSchedulerPriority,
  UserBlockingPriority as UserBlockingSchedulerPriority,
} from 'react-reconciler/src/Scheduler';

import getEventTarget from './getEventTarget';
import { getClosestInstanceFromNode } from '../client/ReactDOMComponentTree';
import { Fiber } from 'react-reconciler/src/ReactInternalTypes';
import { getNearestMountedFiber } from 'react-reconciler/src/ReactFiberTreeReflection';

export function createEventListenerWrapperWithPriority(
  targetContainer: EventTarget,
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags
): Function {
  const eventPriority = getEventPriority(domEventName);
  let listenerWrapper;
  switch (eventPriority) {
    case DiscreteEventPriority:
      listenerWrapper = dispatchDiscreteEvent;
      break;
    case ContinuousEventPriority:
      listenerWrapper = dispatchContinuousEvent;
      break;
    case DefaultEventPriority:
    default:
      listenerWrapper = dispatchEvent;
      break;
  }
  return listenerWrapper.bind(
    null,
    domEventName,
    eventSystemFlags,
    targetContainer
  );
}

export function getEventPriority(domEventName: DOMEventName): EventPriority {
  switch (domEventName) {
    // Used by SimpleEventPlugin:
    case 'cancel':
    case 'click':
    case 'close':
    case 'contextmenu':
    case 'copy':
    case 'cut':
    case 'auxclick':
    case 'dblclick':
    case 'dragend':
    case 'dragstart':
    case 'drop':
    case 'focusin':
    case 'focusout':
    case 'input':
    case 'invalid':
    case 'keydown':
    case 'keypress':
    case 'keyup':
    case 'mousedown':
    case 'mouseup':
    case 'paste':
    case 'pause':
    case 'play':
    case 'pointercancel':
    case 'pointerdown':
    case 'pointerup':
    case 'ratechange':
    case 'reset':
    case 'resize':
    case 'seeked':
    case 'submit':
    case 'touchcancel':
    case 'touchend':
    case 'touchstart':
    case 'volumechange':
    // Used by polyfills:
    // eslint-disable-next-line no-fallthrough
    case 'change':
    case 'selectionchange':
    case 'textInput':
    case 'compositionstart':
    case 'compositionend':
    case 'compositionupdate':
    // Only enableCreateEventHandleAPI:
    // eslint-disable-next-line no-fallthrough
    case 'beforeblur':
    case 'afterblur':
    // Not used by React but could be by user code:
    // eslint-disable-next-line no-fallthrough
    case 'beforeinput':
    case 'blur':
    case 'fullscreenchange':
    case 'focus':
    case 'hashchange':
    case 'popstate':
    case 'select':
    case 'selectstart':
      return DiscreteEventPriority;
    case 'drag':
    case 'dragenter':
    case 'dragexit':
    case 'dragleave':
    case 'dragover':
    case 'mousemove':
    case 'mouseout':
    case 'mouseover':
    case 'pointermove':
    case 'pointerout':
    case 'pointerover':
    case 'scroll':
    case 'toggle':
    case 'touchmove':
    case 'wheel':
    // Not used by React but could be by user code:
    // eslint-disable-next-line no-fallthrough
    case 'mouseenter':
    case 'mouseleave':
    case 'pointerenter':
    case 'pointerleave':
      return ContinuousEventPriority;
    case 'message': {
      // We might be in the Scheduler callback.
      // Eventually this mechanism will be replaced by a check
      // of the current priority on the native scheduler.
      const schedulerPriority = getCurrentSchedulerPriorityLevel();
      switch (schedulerPriority) {
        case ImmediateSchedulerPriority:
          return DiscreteEventPriority;
        case UserBlockingSchedulerPriority:
          return ContinuousEventPriority;
        case NormalSchedulerPriority:
        case LowSchedulerPriority:
          // TODO: Handle LowSchedulerPriority, somehow. Maybe the same lane as hydration.
          return DefaultEventPriority;
        case IdleSchedulerPriority:
          return IdleEventPriority;
        default:
          return DefaultEventPriority;
      }
    }
    default:
      return DefaultEventPriority;
  }
}

export function dispatchDiscreteEvent(
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
  container: EventTarget,
  nativeEvent: AnyNativeEvent
) {
  dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
}

export function dispatchEvent(
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
  targetContainer: EventTarget,
  nativeEvent: AnyNativeEvent
): void {
  console.log('Button clicked!');
  let blockedOn = findInstanceBlockingEvent(nativeEvent);
  if (blockedOn === null) {
    dispatchEventForPluginEventSystem(
      domEventName,
      eventSystemFlags,
      nativeEvent,
      return_targetInst,
      targetContainer
    );
    // clearIfContinuousEvent(domEventName, nativeEvent);
    return;
  }
  // if (
  //   queueIfContinuousEvent(
  //     blockedOn,
  //     domEventName,
  //     eventSystemFlags,
  //     targetContainer,
  //     nativeEvent
  //   )
  // ) {
  //   nativeEvent.stopPropagation();
  //   return;
  // }
  // // We need to clear only if we didn't queue because
  // // queueing is accumulative.
  // clearIfContinuousEvent(domEventName, nativeEvent);
  // if (
  //   eventSystemFlags & IS_CAPTURE_PHASE &&
  //   isDiscreteEventThatRequiresHydration(domEventName)
  // ) {
  //   while (blockedOn !== null) {
  //     const fiber = getInstanceFromNode(blockedOn);
  //     if (fiber !== null) {
  //       attemptSynchronousHydration(fiber);
  //     }
  //     const nextBlockedOn = findInstanceBlockingEvent(nativeEvent);
  //     if (nextBlockedOn === null) {
  //       dispatchEventForPluginEventSystem(
  //         domEventName,
  //         eventSystemFlags,
  //         nativeEvent,
  //         return_targetInst,
  //         targetContainer
  //       );
  //     }
  //     if (nextBlockedOn === blockedOn) {
  //       break;
  //     }
  //     blockedOn = nextBlockedOn;
  //   }
  //   if (blockedOn !== null) {
  //     nativeEvent.stopPropagation();
  //   }
  //   return;
  // }
  // // This is not replayable so we'll invoke it but without a target,
  // // in case the event system needs to trace it.
  // dispatchEventForPluginEventSystem(
  //   domEventName,
  //   eventSystemFlags,
  //   nativeEvent,
  //   null,
  //   targetContainer
  // );
}

export let return_targetInst: null | Fiber = null;

// Returns a SuspenseInstance or Container if it's blocked.
// The return_targetInst field above is conceptually part of the return value.
export function findInstanceBlockingEvent(
  nativeEvent: AnyNativeEvent
): null | Container | SuspenseInstance {
  return_targetInst = null;

  const nativeEventTarget = getEventTarget(nativeEvent);
  let targetInst = getClosestInstanceFromNode(nativeEventTarget);

  if (targetInst !== null) {
    const nearestMounted = getNearestMountedFiber(targetInst);
    if (nearestMounted === null) {
      // This tree has been unmounted already. Dispatch without a target.
      targetInst = null;
    } else {
      // const tag = nearestMounted.tag;
      // if (tag === SuspenseComponent) {
      // const instance = getSuspenseInstanceFromFiber(nearestMounted);
      // if (instance !== null) {
      // Queue the event to be replayed later. Abort dispatching since we
      // don't want this event dispatched twice through the event system.
      // TODO: If this is the first discrete event in the queue. Schedule an increased
      // priority for this boundary.
      // return instance;
    }
    // This shouldn't happen, something went wrong but to avoid blocking
    // the whole system, dispatch the event without a target.
    // TODO: Warn.
    // targetInst = null;
    // } else if (tag === HostRoot) {
    // const root: FiberRoot = nearestMounted.stateNode;
    // if (isRootDehydrated(root)) {
    // If this happens during a replay something went wrong and it might block
    // the whole system.
    // return getContainerFromFiber(nearestMounted);
    // }
    // targetInst = null;
    // } else if (nearestMounted !== targetInst) {
    // If we get an event (ex: img onload) before committing that
    // component's mount, ignore it for now (that is, treat it as if it was an
    // event on a non-React tree). We might also consider queueing events and
    // dispatching them after the mount.
    // targetInst = null;
    // }
    // }
  }
  return_targetInst = targetInst;
  // We're not blocked on anything.
  return null;
}