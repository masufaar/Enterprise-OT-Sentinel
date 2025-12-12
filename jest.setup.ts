import '@testing-library/jest-dom';

// Fix for missing Node.js type definitions
declare var global: any;
declare var require: any;

// Polyfill for TextEncoder/TextDecoder if missing in JSDOM
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}