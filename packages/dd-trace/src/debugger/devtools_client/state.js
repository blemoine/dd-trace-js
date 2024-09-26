'use strict'

const session = require('./session')

const scripts = []

module.exports = {
  probes: new Map(),
  breakpoints: new Map(),

  /**
   * Find the matching script that can be inspected based on a partial path.
   *
   * Algorithm: Find the sortest url that ends in the requested path.
   *
   * Will identify the correct script as long as Node.js doesn't load a module from a `node_modules` folder outside the
   * project root. If so, there's a risk that this path is shorter than the expected path inside the project root.
   * Example of mismatch where path = `index.js`:
   *
   * Expected match:       /www/code/my-projects/demo-project1/index.js
   * Actual shorter match: /www/node_modules/dd-trace/index.js
   *
   * To fix this, specify a more unique file path, e.g `demo-project1/index.js` instead of `index.js`
   *
   * @param {string} path
   * @returns {[string, string] | undefined}
   */
  getScript (path) {
    return scripts
      .filter(([url]) => url.endsWith(path))
      .sort(([a], [b]) => a.length - b.length)[0]
  }
}

// Known params.url protocols:
// - `node:` - Ignored, as we don't want to instrument Node.js internals
// - `wasm:` - Ignored, as we don't support instrumenting WebAssembly
// - `file:` - Regular on-disk file
// Unknown params.url values:
// - `structured-stack` - Not sure what this is, but should just be ignored
// - `` - Not sure what this is, but should just be ignored
// TODO: Event fired for all files, every time debugger is enabled. So when we disable it, we need to reset the state
session.on('Debugger.scriptParsed', ({ params }) => {
  if (params.url.startsWith('file:')) {
    scripts.push([params.url, params.scriptId])
  }
})