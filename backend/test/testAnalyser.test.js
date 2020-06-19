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
      assert.deepEqual(testAnalyser.verifyFileIsTest(rootFolder, relativeFileName),  {
        ext: '',
        filename: '',
        lang: 'unknown',
        module: '',
        modulePath: '',
        ownershipFilePath: '/java/resources/ownership.yaml',
        relative: '/',
        root: 'module/resources/file.xml',
        testFile: false,
        testFolder: false
      } );
    });
    it('regular java file - not a test file', function () {
      let rootFolder = "file.java";
      let relativeFileName = "module/java/src/";
      assert.deepEqual(testAnalyser.verifyFileIsTest(rootFolder, relativeFileName), {
        ext: '',
        filename: '',
        lang: 'unknown',
        module: 'module',
        modulePath: 'module',
        ownershipFilePath: 'module/java/resources/ownership.yaml',
        relative: 'module/java/src/',
        root: 'file.java',
        testFile: false,
        testFolder: false
      }  );
    });
    it('java test file', function () {
      let rootFolder = "/";
      let relativeFileName = "module/java/src/fileTest.java";
      assert.deepEqual(testAnalyser.verifyFileIsTest(rootFolder, relativeFileName), {
        ext: 'java',
        filename: 'fileTest',
        lang: 'java',
        module: 'module',
        modulePath: 'module',
        ownershipFilePath: 'module/java/resources/ownership.yaml',
        relative: 'module/java/src/fileTest.java',
        root: '/',
        testFile: true,
        testFolder: false
      });
    });
  });
});
