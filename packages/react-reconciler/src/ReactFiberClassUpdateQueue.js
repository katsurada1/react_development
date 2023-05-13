/**
 * @flow
 */

import { Fiber } from './ReactInternalTypes';

// function enqueueUpdate() {}

export type SharedQueue<State> = {};

export type UpdateQueue<State> = {
  shared: SharedQueue<State>;
};

export function initializeUpdateQueue<State>(fiber: Fiber): void {
  const queue: UpdateQueue<State> = {
    shared: {},
  };
  fiber.updateQueue = queue;
}
