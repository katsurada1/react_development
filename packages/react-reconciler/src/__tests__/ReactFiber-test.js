'use strict';

import { JSDOM } from 'jsdom';
import { ConcurrentRoot } from '../ReactRootTags';
import { createHostRootFiber } from '../ReactFiber';
import { ConcurrentMode } from '../ReactTypeOfMode';

describe('ReactFiber', () => {
  test('createHostRootFiber', () => {
    let fiber = createHostRootFiber(ConcurrentRoot);
    expect(fiber.tag).toBe(ConcurrentRoot);
    expect(fiber.mode).toBe(ConcurrentMode);
  });
});
