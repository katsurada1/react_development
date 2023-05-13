import { JSDOM } from 'jsdom';

import {
  dispatchDiscreteEvent,
  findInstanceBlockingEvent,
  getEventPriority,
} from '../ReactDOMEventListener';

import { createHostRootFiber } from 'react-reconciler/src/ReactFiber';
import { ConcurrentRoot } from 'react-reconciler/src/ReactRootTags';
import { precacheFiberNode } from '../../client/ReactDOMComponentTree';

test('call test', () => {
  getEventPriority('message');
});

describe('dispatchEvent tests', () => {
  let dom;
  let targetNode;
  let nativeEvent;
  let hostInst;

  beforeEach(() => {
    dom = new JSDOM(
      '<!DOCTYPE html><div><svg><use></use></svg><div>Click me</div></div>'
    );
    global.window = dom.window;
    targetNode = dom.window.document.querySelector('div');
    nativeEvent = new dom.window.MouseEvent('click', {});
    targetNode.dispatchEvent(nativeEvent);
    hostInst = createHostRootFiber(ConcurrentRoot);
  });

  // test('dispatchDiscreteEvent', () => {
  //   const domEventName = 'click';
  //   const eventSystemFlags = { bubbles: true };
  //   // Create a virtual DOM using JSDOM
  //   const { document } = window;

  //   // Create a button element
  //   const myButton = document.createElement('button');
  //   myButton.textContent = 'Click me';

  //   // Append the button to the body of the virtual DOM
  //   document.body.appendChild(myButton);

  //   // Add an event listener to the button
  //   myButton.addEventListener('click', () => {
  //     console.log('Button clicked!');
  //   });

  //   // Call the function to be tested
  //   dispatchDiscreteEvent(
  //     domEventName,
  //     eventSystemFlags,
  //     myButton,
  //     nativeEvent
  //   );
  // });

  test('findInstanceBlockingEvent', () => {
    precacheFiberNode(hostInst, targetNode);
    expect(findInstanceBlockingEvent(nativeEvent)).toBe(null);
  });
});
