/**
 * @flow
 */
import { IS_CAPTURE_PHASE } from './EventSystemFlags';
import { allNativeEvents } from './EventRegistry';
import {createEventListenerWrapperWithPriority} from './ReactDOMEventListener';
import * as SimpleEventPlugin from './plugins/SimpleEventPlugin';

// List of events that need to be individually attached to media elements.
export const mediaEventTypes: Array<DOMEventName> = [
  'abort',
  'canplay',
  'canplaythrough',
  'durationchange',
  'emptied',
  'encrypted',
  'ended',
  'error',
  'loadeddata',
  'loadedmetadata',
  'loadstart',
  'pause',
  'play',
  'playing',
  'progress',
  'ratechange',
  'resize',
  'seeked',
  'seeking',
  'stalled',
  'suspend',
  'timeupdate',
  'volumechange',
  'waiting',
];

// We should not delegate these events to the container, but rather
// set them on the actual target element itself. This is primarily
// because these events do not consistently bubble in the DOM.
export const nonDelegatedEvents: Set<DOMEventName> = new Set([
  'cancel',
  'close',
  'invalid',
  'load',
  'scroll',
  'toggle',
  // In order to reduce bytes, we insert the above array of media events
  // into this Set. Note: the "error" event isn't an exclusive media event,
  // and can occur on other elements too. Rather than duplicate that event,
  // we just take it from the media events array.
  ...mediaEventTypes,
]);

SimpleEventPlugin.registerEvents();

const listeningMarker = '_reactListening' + Math.random().toString(36).slice(2);


export function listenToAllSupportedEvents(rootContainerElement: EventTarget) {
  if (!(rootContainerElement: any)[listeningMarker]) {
    (rootContainerElement: any)[listeningMarker] = true;
    allNativeEvents.forEach((domEventName) => {
      // We handle selectionchange separately because it
      // doesn't bubble and needs to be on the document.
      if (domEventName !== 'selectionchange') {
        if (!nonDelegatedEvents.has(domEventName)) {
          listenToNativeEvent(domEventName, false, rootContainerElement);
        }
        listenToNativeEvent(domEventName, true, rootContainerElement);
      }
    });
    // const ownerDocument =
    //   (rootContainerElement: any).nodeType === DOCUMENT_NODE
    //     ? rootContainerElement
    //     : (rootContainerElement: any).ownerDocument;
    // if (ownerDocument !== null) {
    //   // The selectionchange event also needs deduplication
    //   // but it is attached to the document.
    //   if (!(ownerDocument: any)[listeningMarker]) {
    //     (ownerDocument: any)[listeningMarker] = true;
    //     listenToNativeEvent('selectionchange', false, ownerDocument);
    //   }
    // }
  }
}

export function listenToNativeEvent(
  domEventName: DOMEventName,
  isCapturePhaseListener: boolean,
  target: EventTarget
): void {
  // if (__DEV__) {
  //   if (nonDelegatedEvents.has(domEventName) && !isCapturePhaseListener) {
  //     console.error(
  //       'Did not expect a listenToNativeEvent() call for "%s" in the bubble phase. ' +
  //         'This is a bug in React. Please file an issue.',
  //       domEventName
  //     );
  //   }
  // }

  let eventSystemFlags = 0;
  if (isCapturePhaseListener) {
    eventSystemFlags |= IS_CAPTURE_PHASE;
  }
  addTrappedEventListener(
    target,
    domEventName,
    eventSystemFlags,
    isCapturePhaseListener
  );
}

addTrappedEventListener(
  targetContainer: EventTarget,
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
  isCapturePhaseListener: boolean,
  isDeferredListenerForLegacyFBSupport?: boolean,
) {
  let listener = createEventListenerWrapperWithPriority(
    targetContainer,
    domEventName,
    eventSystemFlags,
  );
  // If passive option is not supported, then the event will be
  // active and not passive.
  let isPassiveListener: void | boolean = undefined;
  if (passiveBrowserEventsSupported) {
    // Browsers introduced an intervention, making these events
    // passive by default on document. React doesn't bind them
    // to document anymore, but changing this now would undo
    // the performance wins from the change. So we emulate
    // the existing behavior manually on the roots now.
    // https://github.com/facebook/react/issues/19651
    if (
      domEventName === 'touchstart' ||
      domEventName === 'touchmove' ||
      domEventName === 'wheel'
    ) {
      isPassiveListener = true;
    }
  }

  targetContainer =
    enableLegacyFBSupport && isDeferredListenerForLegacyFBSupport
      ? (targetContainer: any).ownerDocument
      : targetContainer;

  let unsubscribeListener;
  // When legacyFBSupport is enabled, it's for when we
  // want to add a one time event listener to a container.
  // This should only be used with enableLegacyFBSupport
  // due to requirement to provide compatibility with
  // internal FB www event tooling. This works by removing
  // the event listener as soon as it is invoked. We could
  // also attempt to use the {once: true} param on
  // addEventListener, but that requires support and some
  // browsers do not support this today, and given this is
  // to support legacy code patterns, it's likely they'll
  // need support for such browsers.
  if (enableLegacyFBSupport && isDeferredListenerForLegacyFBSupport) {
    const originalListener = listener;
    // $FlowFixMe[missing-this-annot]
    // $FlowFixMe[definition-cycle]
    listener = function (...p) {
      removeEventListener(
        targetContainer,
        domEventName,
        unsubscribeListener,
        isCapturePhaseListener,
      );
      return originalListener.apply(this, p);
    };
  }
  // TODO: There are too many combinations here. Consolidate them.
  if (isCapturePhaseListener) {
    if (isPassiveListener !== undefined) {
      unsubscribeListener = addEventCaptureListenerWithPassiveFlag(
        targetContainer,
        domEventName,
        listener,
        isPassiveListener,
      );
    } else {
      unsubscribeListener = addEventCaptureListener(
        targetContainer,
        domEventName,
        listener,
      );
    }
  } else {
    if (isPassiveListener !== undefined) {
      unsubscribeListener = addEventBubbleListenerWithPassiveFlag(
        targetContainer,
        domEventName,
        listener,
        isPassiveListener,
      );
    } else {
      unsubscribeListener = addEventBubbleListener(
        targetContainer,
        domEventName,
        listener,
      );
    }
  }
}