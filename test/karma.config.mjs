import chalk from 'chalk';
// import { babel } from '@rollup/plugin-babel';
// import json from '@rollup/plugin-json';
// import ts from '@rollup/plugin-typescript';
// import { nodeResolve } from '@rollup/plugin-node-resolve';
// import commonjs from '@rollup/plugin-commonjs';
//
// const plugins = [
//   json(),
//   ts(),
//   babel({
//     extensions: ['.ts', '.js'],
//     babelHelpers: 'bundled',
//   }),
//   nodeResolve(),
//   commonjs({ include: 'node_modules/**' })
// ];

// https://docs.github.com/en/actions/learn-github-actions/environment-variables#default-environment-variables
const CI = !!process.env.CI
const BROWSERS = process.env.BROWSERS ? process.env.BROWSERS.split(/,| /g) : ['chrome', 'firefox'];
const TEST_FILES = process.env.TEST_FILES ? process.env.TEST_FILES.split(/,| /g) : null;
const VISUAL_TEST_CONFIG = {
  recreate: Number(process.env.QUNIT_RECREATE_VISUAL_REFS),
  debug: Number(process.env.QUNIT_DEBUG_VISUAL_TESTS),
};

/** 
 * https://github.com/tom-sherman/blog/blob/main/posts/02-running-jest-tests-in-a-browser.md
 * @param {*} config 
 */
export default async function (config) {
  const browsers = (CI ? ['ChromeHeadlessX', 'FirefoxHeadless'] : ['ChromeHeadlessX', 'FirefoxHeadless', 'Chrome', 'Firefox'])
    .filter(browser => BROWSERS.some(b => b.startsWith(browser.toLowerCase())));
  if (VISUAL_TEST_CONFIG.debug || VISUAL_TEST_CONFIG.recreate) {
    browsers.length > 1 && console.warn(chalk.yellow(`Debugging/recreating visual tests is allowed ONLY when running tests in a single browser`));
    if (CI) {
      throw new Error(chalk.red(`Debugging/recreating visual tests is banned in CI`));
    }
  }
  config.set({
    plugins: [
      'karma-jasmine',
      'karma-qunit',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-coverage',
    ],

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '../',
    autoWatch: false,
    singleRun: true,

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: [/*'jasmine',*/ 'qunit'],
    browsers,
    customLaunchers: {
      ChromeHeadlessX: {
        base: 'ChromeHeadless',
        flags: [
          '--headless',
          '--no-sandbox',
          '--disable-gpu',
          '--disable-translate',
          '--disable-extensions',
          '--remote-debugging-port=9222',
        ],
      },
      FirefoxHeadless: {
        base: 'Firefox',
        flags: [
          '--headless',
        ],
      },
    },

    reporters: ['progress', 'coverage'],
    coverageReporter: {
      reporters: [
        { type: 'lcov', dir: '.nyc_output/' },
        // Karma uses subdirs by default to account for multiple browsers.
        // For the JSON file, it's important we disable 'subdir' so that
        // the 'nyc report' command can pick this up when combining code
        // coverage with the Node.js test run.
        { type: 'json', dir: '.nyc_output/', subdir: '.' }
      ]
    },

    // list of files / patterns to load in the browser
    files: [
      { pattern: 'test/fixtures/*', included: false, served: true, watched: false, nocache: false },
      { pattern: 'test/lib/*.js', included: true, served: true, watched: true, nocache: false },
      { pattern: 'test/lib/tests.css', included: true, served: true, watched: true, nocache: false }, // qunit only
      { pattern: 'test/visual/golden/*', included: false, served: true, watched: false, nocache: false },

      { pattern: 'dist/index.js', type: 'js', included: true, served: true, watched: true, nocache: true },
      { pattern: 'dist/index.js.map', included: false, served: true, watched: false, nocache: true },

      { pattern: 'test/karma.setup.js', type: 'js', included: true, served: true, watched: true, nocache: false },

      // add test files last
      ...(TEST_FILES?
        TEST_FILES.map(file => ({ pattern: file, type: 'js', included: true, served: true, watched: true, nocache: false })) :
        [
          { pattern: 'test/unit/**/*.js', type: 'js', included: true, served: true, watched: true, nocache: false },
          { pattern: 'test/visual/**/*.js', type: 'js', included: true, served: true, watched: true, nocache: false },
        ]
      )
    ],

    /**
     * https://github.com/karma-runner/karma/issues/2917#issuecomment-496473358
     */
    proxies: {
      '/fixtures/': '/base/test/fixtures/',
      '/golden_maker': '/base/test/lib/goldenMaker.html',
      '/golden_maker.html': '/base/test/lib/goldenMaker.html',
      '/golden/': '/base/test/visual/golden/',
      '/assets/': '/base/test/visual/assets/',
      '/goldens/': (await import('./GoldensServer.js')).startGoldensServer().url,
    },

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      // 'test/**/*.js': ['rollup'],
      'dist/index.js': ['coverage'],
    },

    /**
     * Object available on the client in `window.__karma__.config`
     */
    client: {
      clearContext: false,
      CI: !!CI,
      visual: {        
        recreate: browsers.length === 1 && !CI && VISUAL_TEST_CONFIG.recreate,
        debug: browsers.length === 1 && !CI && VISUAL_TEST_CONFIG.debug,
      },
      /**
       * QUnit client config
       * https://github.com/karma-runner/karma-qunit
       */
      qunit: {
        showUI: true,
        testTimeout: CI ? 15000 : 5000,
        filter: process.env.QUNIT_FILTER || null,
        reorder: false,
        noglobals: true,
        hidepassed: true,
      }
    }
  });
}