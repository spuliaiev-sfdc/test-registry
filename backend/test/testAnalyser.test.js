var
  assert = require('assert'),
  testAnalyser = require('../src/parsers/testAnalyser');


describe('testAnalyser', function() {
  describe('#verifyFileIsTest()', function() {
    it('not a test file', function () {
      let rootFolder = "module/resources/file.xml";
      let relativeFileName = "/";
      let fileContent = "";
      let fileInfo = {};
      assert.equal(testAnalyser.verifyFileIsTest(rootFolder, relativeFileName, fileContent), false);
    });
    it('regular java file - not a test file', function () {
      let rootFolder = "file.java";
      let relativeFileName = "module/java/src/";
      let fileContent = "";
      let fileInfo = {};
      assert.equal(testAnalyser.verifyFileIsTest(rootFolder, relativeFileName, fileContent), false);
    });
    it('java test file', function () {
      let rootFolder = "/";
      let relativeFileName = "module/java/src/fileTest.java";
      let fileContent = "";
      assert.equal(testAnalyser.verifyFileIsTest(rootFolder, relativeFileName, fileContent), true);
    });
  });
});
