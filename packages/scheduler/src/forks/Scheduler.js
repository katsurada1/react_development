/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-disable no-var */

import type { PriorityLevel } from '../SchedulerPriorities';
// TODO: Use symbols?
import {
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  LowPriority,
  IdlePriority,
} from '../SchedulerPriorities';

import { enableProfiling, frameYieldMs } from '../SchedulerFeatureFlags';

import { push, peek, pop } from '../SchedulerMinHeap';

export type Callback = (boolean) => ?Callback;

type Task = {
  id: number,
  callback: Callback | null,
  priorityLevel: PriorityLevel,
  startTime: number,
  expirationTime: number,
  sortIndex: number,
  isQueued?: boolean,
};

let getCurrentTime: () => number | DOMHighResTimeStamp;
const hasPerformanceNow =
  // $FlowFixMe[method-unbinding]
  typeof performance === 'object' && typeof performance.now === 'function';

if (hasPerformanceNow) {
  const localPerformance = performance;
  getCurrentTime = () => localPerformance.now();
} else {
  const localDate = Date;
  const initialTime = localDate.now();
  getCurrentTime = () => localDate.now() - initialTime;
}

// Max 31 bit integer. The max integer size in V8 for 32-bit systems.
// Math.pow(2, 30) - 1
// 0b111111111111111111111111111111
var maxSigned31BitInt = 1073741823;

// Times out immediately
var IMMEDIATE_PRIORITY_TIMEOUT = -1;
// Eventually times out
var USER_BLOCKING_PRIORITY_TIMEOUT = 250;
var NORMAL_PRIORITY_TIMEOUT = 5000;
var LOW_PRIORITY_TIMEOUT = 10000;
// Never times out
var IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt;

// Tasks are stored on a min heap
var taskQueue: Array<Task> = [];
var timerQueue: Array<Task> = [];

// Incrementing id counter. Used to maintain insertion order.
var taskIdCounter = 1;

var currentTask = null;
var currentPriorityLevel = NormalPriority;

// This is set while performing work, to prevent re-entrance.
var isPerformingWork = false;

var isHostCallbackScheduled = false;
var isHostTimeoutScheduled = false;

let startTime = -1;

function unstable_scheduleCallback(
  priorityLevel: PriorityLevel,
  callback: Callback,
  options?: { delay: number }
): Task {
  var currentTime = getCurrentTime();
  var startTime;
  // if (typeof options === 'object' && options !== null) {
  //   var delay = options.delay;
  //   if (typeof delay === 'number' && delay > 0) {
  //     startTime = currentTime + delay;
  //   } else {
  //     startTime = currentTime;
  //   }
  // } else {
  startTime = currentTime;
  var timeout;
  switch (priorityLevel) {
    case ImmediatePriority:
      timeout = IMMEDIATE_PRIORITY_TIMEOUT;
      break;
    case UserBlockingPriority:
      timeout = USER_BLOCKING_PRIORITY_TIMEOUT;
      break;
    case IdlePriority:
      timeout = IDLE_PRIORITY_TIMEOUT;
      break;
    case LowPriority:
      timeout = LOW_PRIORITY_TIMEOUT;
      break;
    case NormalPriority:
    default:
      timeout = NORMAL_PRIORITY_TIMEOUT;
      break;
  }
  var expirationTime = startTime + timeout;
  var newTask: Task = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    expirationTime,
    sortIndex: -1,
  };
  // if (startTime > currentTime) {
  // This is a delayed task.
  // newTask.sortIndex = startTime;
  // push(timerQueue, newTask);
  // if (peek(taskQueue) === null && newTask === peek(timerQueue)) {
  // All tasks are delayed, and this is the task with the earliest delay.
  // if (isHostTimeoutScheduled) {
  // Cancel an existing timeout.
  // cancelHostTimeout();
  // } else {
  // isHostTimeoutScheduled = true;
  // }
  // Schedule a timeout.
  // requestHostTimeout(handleTimeout, startTime - currentTime);
  // }
  // } else {
  newTask.sortIndex = expirationTime;
  push(taskQueue, newTask);
  // Schedule a host callback, if needed. If we're already performing work,
  // wait until the next time we yield.
  if (!isHostCallbackScheduled && !isPerformingWork) {
    isHostCallbackScheduled = true;
    requestHostCallback(flushWork);
  }
  // }
  return newTask;
}

function handleTimeout(currentTime: number) {
  isHostTimeoutScheduled = false;
  advanceTimers(currentTime);

  if (!isHostCallbackScheduled) {
    if (peek(taskQueue) !== null) {
      isHostCallbackScheduled = true;
      requestHostCallback(flushWork);
    } else {
      const firstTimer = peek(timerQueue);
      if (firstTimer !== null) {
        requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
      }
    }
  }
}

function advanceTimers(currentTime: number) {
  // Check for tasks that are no longer delayed and add them to the queue.
  let timer = peek(timerQueue);
  while (timer !== null) {
    if (timer.callback === null) {
      // Timer was cancelled.
      pop(timerQueue);
    } else if (timer.startTime <= currentTime) {
      // Timer fired. Transfer to the task queue.
      pop(timerQueue);
      timer.sortIndex = timer.expirationTime;
      push(taskQueue, timer);
    } else {
      // Remaining timers are pending.
      return;
    }
    timer = peek(timerQueue);
  }
}

function flushWork(hasTimeRemaining: boolean, initialTime: number) {
  // We'll need a host callback the next time work is scheduled.
  isHostCallbackScheduled = false;
  if (isHostTimeoutScheduled) {
    // We scheduled a timeout but it's no longer needed. Cancel it.
    isHostTimeoutScheduled = false;
    cancelHostTimeout();
  }
  //
  isPerformingWork = true;
  const previousPriorityLevel = currentPriorityLevel;
  try {
    // No catch in prod code path.
    return workLoop(hasTimeRemaining, initialTime);
  } finally {
    currentTask = null;
    currentPriorityLevel = previousPriorityLevel;
    isPerformingWork = false;
  }
}

function workLoop(hasTimeRemaining: boolean, initialTime: number) {
  let currentTime = initialTime;
  advanceTimers(currentTime);
  currentTask = peek(taskQueue);
  while (
    currentTask !== null
    // && !(enableSchedulerDebugging && isSchedulerPaused)
  ) {
    if (
      currentTask.expirationTime > currentTime &&
      (!hasTimeRemaining || shouldYieldToHost())
    ) {
      // This currentTask hasn't expired, and we've reached the deadline.
      break;
    }
    // $FlowFixMe[incompatible-use] found when upgrading Flow
    const callback = currentTask.callback;
    if (typeof callback === 'function') {
      // $FlowFixMe[incompatible-use] found when upgrading Flow
      currentTask.callback = null;
      // $FlowFixMe[incompatible-use] found when upgrading Flow
      currentPriorityLevel = currentTask.priorityLevel;
      // $FlowFixMe[incompatible-use] found when upgrading Flow
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
      const continuationCallback = callback(didUserCallbackTimeout);
      currentTime = getCurrentTime();
      if (typeof continuationCallback === 'function') {
        // If a continuation is returned, immediately yield to the main thread
        // regardless of how much time is left in the current time slice.
        // $FlowFixMe[incompatible-use] found when upgrading Flow
        currentTask.callback = continuationCallback;
        advanceTimers(currentTime);
        return true;
      } else {
        if (currentTask === peek(taskQueue)) {
          pop(taskQueue);
        }
        advanceTimers(currentTime);
      }
    } else {
      pop(taskQueue);
    }
    currentTask = peek(taskQueue);
  }
  // // Return whether there's additional work
  if (currentTask !== null) {
    return true;
  } else {
    const firstTimer = peek(timerQueue);
    if (firstTimer !== null) {
      requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
    }
    return false;
  }
}

// // Scheduler periodically yields in case there is other work on the main
// // thread, like user events. By default, it yields multiple times per frame.
// // It does not attempt to align with frame boundaries, since most tasks don't
// // need to be frame aligned; for those that do, use requestAnimationFrame.
let frameInterval = frameYieldMs;

function shouldYieldToHost(): boolean {
  const timeElapsed = getCurrentTime() - startTime;
  if (timeElapsed < frameInterval) {
    // The main thread has only been blocked for a really short amount of time;
    // smaller than a single frame. Don't yield yet.
    return false;
  }

  //   // The main thread has been blocked for a non-negligible amount of time. We
  //   // may want to yield control of the main thread, so the browser can perform
  //   // high priority tasks. The main ones are painting and user input. If there's
  //   // a pending paint or a pending input, then we should yield. But if there's
  //   // neither, then we can yield less often while remaining responsive. We'll
  //   // eventually yield regardless, since there could be a pending paint that
  //   // wasn't accompanied by a call to `requestPaint`, or other main thread tasks
  //   // like network events.
  //   // if (enableIsInputPending) {
  //   //   if (needsPaint) {
  //   //     // There's a pending paint (signaled by `requestPaint`). Yield now.
  //   //     return true;
  //   //   }
  //   //   if (timeElapsed < continuousInputInterval) {
  //   //     // We haven't blocked the thread for that long. Only yield if there's a
  //   //     // pending discrete input (e.g. click). It's OK if there's pending
  //   //     // continuous input (e.g. mouseover).
  //   //     if (isInputPending !== null) {
  //   //       return isInputPending();
  //   //     }
  //   //   } else if (timeElapsed < maxInterval) {
  //   //     // Yield if there's either a pending discrete or continuous input.
  //   //     if (isInputPending !== null) {
  //   //       return isInputPending(continuousOptions);
  //   //     }
  //   //   } else {
  //   //     // We've blocked the thread for a long time. Even if there's no pending
  //   //     // input, there may be some other scheduled work that we don't know about,
  //   //     // like a network event. Yield now.
  //   //     return true;
  //   //   }
  //   // }

  //   // `isInputPending` isn't available. Yield now.
  return true;
}

type TimeoutID = number;
let taskTimeoutID: TimeoutID = (-1: any);

// // Capture local references to native APIs, in case a polyfill overrides them.
const localSetTimeout = typeof setTimeout === 'function' ? setTimeout : null;
const localClearTimeout =
  typeof clearTimeout === 'function' ? clearTimeout : null;
const localSetImmediate =
  typeof setImmediate !== 'undefined' ? setImmediate : null; // IE and Node.js + jsdom
let needsPaint = false;

const performWorkUntilDeadline = () => {
  if (scheduledHostCallback !== null) {
    const currentTime = getCurrentTime();
    // Keep track of the start time so we can measure how long the main thread
    // has been blocked.
    startTime = currentTime;
    const hasTimeRemaining = true;
    //
    // If a scheduler task throws, exit the current browser task so the
    // error can be observed.
    //
    // Intentionally not using a try-catch, since that makes some debugging
    // techniques harder. Instead, if `scheduledHostCallback` errors, then
    // `hasMoreWork` will remain true, and we'll continue the work loop.
    let hasMoreWork = true;
    try {
      // $FlowFixMe[not-a-function] found when upgrading Flow
      hasMoreWork = scheduledHostCallback(hasTimeRemaining, currentTime);
    } finally {
      if (hasMoreWork) {
        // If there's more work, schedule the next message event at the end
        // of the preceding one.
        schedulePerformWorkUntilDeadline();
      } else {
        isMessageLoopRunning = false;
        scheduledHostCallback = null;
      }
    }
  } else {
    isMessageLoopRunning = false;
  }
  // Yielding to the browser will give it a chance to paint, so we can
  // reset this.
  needsPaint = false;
};

let scheduledHostCallback:
  | null
  | ((
      hasTimeRemaining: boolean,
      initialTime: DOMHighResTimeStamp | number
    ) => boolean) = null;
let isMessageLoopRunning = false;

let schedulePerformWorkUntilDeadline;
if (typeof localSetImmediate === 'function') {
  // Node.js and old IE.
  // There's a few reasons for why we prefer setImmediate.
  //
  // Unlike MessageChannel, it doesn't prevent a Node.js process from exiting.
  // (Even though this is a DOM fork of the Scheduler, you could get here
  // with a mix of Node.js 15+, which has a MessageChannel, and jsdom.)
  // https://github.com/facebook/react/issues/20756
  //
  // But also, it runs earlier which is the semantic we want.
  // If other browsers ever implement it, it's better to use it.
  // Although both of these would be inferior to native scheduling.
  schedulePerformWorkUntilDeadline = () => {
    localSetImmediate(performWorkUntilDeadline);
  };
}

function requestHostCallback(
  callback: (hasTimeRemaining: boolean, initialTime: number) => boolean
) {
  scheduledHostCallback = callback;
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    schedulePerformWorkUntilDeadline();
  }
}

function requestHostTimeout(
  callback: (currentTime: number) => void,
  ms: number
) {
  // $FlowFixMe[not-a-function] nullable value
  taskTimeoutID = localSetTimeout(() => {
    callback(getCurrentTime());
  }, ms);
}

function cancelHostTimeout() {
  // $FlowFixMe[not-a-function] nullable value
  localClearTimeout(taskTimeoutID);
  taskTimeoutID = ((-1: any): TimeoutID);
}

function unstable_getCurrentPriorityLevel(): PriorityLevel {
  return currentPriorityLevel;
}

export { unstable_getCurrentPriorityLevel, unstable_scheduleCallback };
