'use strict';

import { JSDOM } from 'jsdom';
import { createRoot } from 'react-dom';

test('dummy test', () => {
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="root"></div></body></html>'
  );
  global.document = dom.window.document;
  const rootContainer = document.getElementById('root');

  const root = createRoot(rootContainer);
});
