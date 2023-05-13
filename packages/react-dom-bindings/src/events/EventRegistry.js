/**
 *
 * @flow
 */

import type { DOMEventName } from './DOMEventNames';
import { enableCreateEventHandleAPI } from 'shared/ReactFeatureFlags';

export const allNativeEvents: Set<DOMEventName> = new Set();
if (enableCreateEventHandleAPI) {
  allNativeEvents.add('beforeblur');
  allNativeEvents.add('afterblur');
}

/**
 * Mapping from registration name to event name
 */
export const registrationNameDependencies: {
  [registrationName: string]: Array<DOMEventName>,
} = {};

export function registerTwoPhaseEvent(
  registrationName: string,
  dependencies: Array<DOMEventName>
): void {
  registerDirectEvent(registrationName, dependencies);
  registerDirectEvent(registrationName + 'Capture', dependencies);
}

export function registerDirectEvent(
  registrationName: string,
  dependencies: Array<DOMEventName>
) {
  // if (__DEV__) {
  //   if (registrationNameDependencies[registrationName]) {
  //     console.error(
  //       'EventRegistry: More than one plugin attempted to publish the same ' +
  //         'registration name, `%s`.',
  //       registrationName
  //     );
  //   }
  // }

  registrationNameDependencies[registrationName] = dependencies;

  // if (__DEV__) {
  //   const lowerCasedName = registrationName.toLowerCase();
  //   possibleRegistrationNames[lowerCasedName] = registrationName;

  //   if (registrationName === 'onDoubleClick') {
  //     possibleRegistrationNames.ondblclick = registrationName;
  //   }
  // }

  for (let i = 0; i < dependencies.length; i++) {
    allNativeEvents.add(dependencies[i]);
  }
}
