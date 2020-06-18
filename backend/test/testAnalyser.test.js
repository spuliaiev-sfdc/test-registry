var
  assert = require('assert'),
  utils = require('../src/corUtils.js')
    // This is just to set logging to warnings level
    .warningsOnly(),
  testAnalyser = require('../src/parsers/testAnalyser');


describe('testAnalyser', function() {
  describe('#verifyFileIsTest()', function() {
    it('not a test file', function () {
      let rootFolder = "module/resources/file.xml";
      let relativeFileName = "/";
      assert.equal(testAnalyser.verifyFileIsTest(rootFolder, relativeFileName), false);
    });
    it('regular java file - not a test file', function () {
      let rootFolder = "file.java";
      let relativeFileName = "module/java/src/";
      assert.equal(testAnalyser.verifyFileIsTest(rootFolder, relativeFileName), false);
    });
    it('java test file', function () {
      let rootFolder = "/";
      let relativeFileName = "module/java/src/fileTest.java";
      assert.equal(testAnalyser.verifyFileIsTest(rootFolder, relativeFileName), true);
    });
  });
});
