import getEventTarget from '../getEventTarget';

import { JSDOM } from 'jsdom';

describe('getEventTarget', () => {
  let dom;
  let targetNode;
  let useElement;
  let parentNode;
  let textNode;

  beforeEach(() => {
    dom = new JSDOM(
      '<!DOCTYPE html><div><svg><use></use></svg><div>Click me</div></div>'
    );
    global.window = dom.window;
    targetNode = dom.window.document.querySelector('div');
    useElement = dom.window.document.querySelector('use');
    parentNode = dom.window.document.querySelector('div');
    textNode = parentNode.firstChild;
  });

  test('returns the event target node', () => {
    const event = new dom.window.MouseEvent('click', {});
    targetNode.dispatchEvent(event);
    expect(getEventTarget(event)).toBe(targetNode);
  });

  test('handles SVG <use> elements', () => {
    useElement.correspondingUseElement = targetNode;
    const event = new dom.window.MouseEvent('click', {});
    targetNode.dispatchEvent(event);
    expect(getEventTarget(event)).toBe(targetNode);
  });

  test('handles text nodes', () => {
    const event = new dom.window.MouseEvent('click', {});
    targetNode.dispatchEvent(event);
    expect(getEventTarget(event)).toBe(parentNode);
  });
});
