var
  assert = require('assert'),
  utils = require('../src/corUtils.js')
    // This is just to set logging to warnings level
    .warningsOnly(),
  testAnalyser = require('../src/parsers/testAnalyser');

// Async Testing utilities
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { expect } = chai;
chai.use(chaiAsPromised);

describe('testAnalyser', function() {
  describe('#verifyFileIsTest()', function() {
    it('not a test file', function () {
      let rootFolder = 'module/resources/file.xml';
      let relativeFileName = '/';
      let result = testAnalyser.verifyFileIsTest(rootFolder, relativeFileName);
      assert.equal(result.lang, 'unknown');
      assert.equal(result.testFile, false);
    });
    it('regular java file - not a test file', function () {
      let rootFolder = 'file.java';
      let relativeFileName = 'module/java/src/file.java';
      let result = testAnalyser.verifyFileIsTest(rootFolder, relativeFileName);
      assert.equal(result.lang, 'java');
      assert.equal(result.testFile, false);
    });
    it('java test file in Prod module', function () {
      let rootFolder = '/';
      let relativeFileName = 'module/java/src/fileTest.java';
      let result = testAnalyser.verifyFileIsTest(rootFolder, relativeFileName);
      assert.equal(result.lang, 'java');
      assert.equal(result.testFile, true);
    });
    it('java test file in Func Test module', function () {
      let rootFolder = '/';
      let relativeFileName = 'module/test/func/java/src/fileTest.java';
      let result = testAnalyser.verifyFileIsTest(rootFolder, relativeFileName);
      assert.equal(result.lang, 'java');
      assert.equal(result.testFile, true);
    });
    it('java test file in Unit Test module', function () {
      let rootFolder = '/';
      let relativeFileName = 'module/test/unit/java/src/unit/fileTest.java';
      let result = testAnalyser.verifyFileIsTest(rootFolder, relativeFileName);
      assert.equal(result.lang, 'java');
      assert.equal(result.testFile, true);
    });
    it('java test file in StrictUnit Test module', function () {
      let rootFolder = '/';
      let relativeFileName = 'module/test/unit/java/src/strictunit/fileTest.java';
      let result = testAnalyser.verifyFileIsTest(rootFolder, relativeFileName);
      assert.equal(result.lang, 'java');
      assert.equal(result.testFile, true);
    });
  });
});
