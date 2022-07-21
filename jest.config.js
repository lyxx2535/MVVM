module.exports = {

  clearMocks: true,

  collectCoverage: true,

  coverageDirectory: "coverage",

  collectCoverageFrom: ['js/compile.js', 'js/MVVM.js', 'js/observer.js', 'js/watcher.js'],

  testEnvironment: "jsdom",

};
