/**
 * @flow
 */

import { FiberRoot } from 'react-reconciler/src/ReactInternalTypes';

export type Container =
  | (Element & { _reactRootContainer?: FiberRoot })
  | (Document & { _reactRootContainer?: FiberRoot })
  | (DocumentFragment & { _reactRootContainer?: FiberRoot });

// We want this to be the default dispatcher on ReactDOMSharedInternals but we don't want to mutate
// internals in Module scope. Instead we export it and Internals will import it. There is already a cycle
// from Internals -> ReactDOM -> HostConfig -> Internals so this doesn't introduce a new one.
export const ReactDOMClientDispatcher = {};
