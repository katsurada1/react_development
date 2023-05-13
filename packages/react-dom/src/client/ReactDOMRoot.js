'use restrict';

import ReactDOMSharedInternals from '../ReactDOMSharedInternals';
const { Dispatcher } = ReactDOMSharedInternals;
import { ReactDOMClientDispatcher } from 'react-dom-bindings/src/client/ReactDOMHostConfig';
import { markContainerAsRoot } from 'react-dom-bindings/src/client/ReactDOMComponentTree';
import { COMMENT_NODE } from 'react-dom-bindings/src/client/HTMLNodeType';
import { listenToAllSupportedEvents } from 'react-dom-bindings/src/events/DOMPluginEventSystem';
import { createContainer } from 'react-reconciler/src/ReactFiberReconciler';
import enableFloat from 'shared/ReactFeatureFlags';

export function createRoot(container) {
  const root = createContainer(container);
  markContainerAsRoot(root.current, container);

  if (enableFloat) {
    // Set the default dispatcher to the client dispatcher
    Dispatcher.current = ReactDOMClientDispatcher;
  }
  const rootContainerElement: Document | Element | DocumentFragment =
    container.nodeType === COMMENT_NODE
      ? (container.parentNode: any)
      : container;
  listenToAllSupportedEvents(rootContainerElement);
  return root;
}
