'use strict';

import { createRoot as createRootImpl } from './ReactDOMRoot';

function createRoot(container) {
  createRootImpl(container);
}

export { createRoot };
