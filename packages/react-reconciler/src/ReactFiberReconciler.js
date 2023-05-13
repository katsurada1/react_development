/**
 * @flow
 */
'use strict';

import { createFiberRoot } from './ReactFiberRoot';
import { RootTag } from './ReactRootTags';

export function createContainer(containerInfo, tag: RootTag) {
  return createFiberRoot(containerInfo, tag);
}
