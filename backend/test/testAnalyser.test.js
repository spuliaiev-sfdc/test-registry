var
  assert = require('assert'),
  utils = require('../src/corUtils.js')
    // This is just to set logging to warnings level
    .warningsOnly(),
  testAnalyser = require('../src/parsers/testAnalyser');


describe('testAnalyser', function() {
  describe('#verifyFileIsTest()', function() {
    it('not a test file', function () {
      let rootFolder = 'module/resources/file.xml';
      let relativeFileName = '/';
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
      let rootFolder = 'file.java';
      let relativeFileName = 'module/java/src/';
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
    it('java test file in Prod module', function () {
      let rootFolder = '/';
      let relativeFileName = 'module/java/src/fileTest.java';
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
    it('java test file in Func Test module', function () {
      let rootFolder = '/';
      let relativeFileName = 'module/test/func/java/src/fileTest.java';
      assert.deepEqual(testAnalyser.verifyFileIsTest(rootFolder, relativeFileName), {
        ext: 'java',
        filename: 'fileTest',
        lang: 'java',
        module: 'module',
        modulePath: 'module/test/func/java',
        ownershipFilePath: 'module/test/func/java/java/resources/ownership.yaml',
        relative: 'module/test/func/java/src/fileTest.java',
        root: '/',
        testFile: true,
        testFolder: true,
        testKind: 'func'
      });
    });
    it('java test file in Unit Test module', function () {
      let rootFolder = '/';
      let relativeFileName = 'module/test/unit/java/src/unit/fileTest.java';
      assert.deepEqual(testAnalyser.verifyFileIsTest(rootFolder, relativeFileName), {
        ext: 'java',
        filename: 'fileTest',
        lang: 'java',
        module: 'module',
        modulePath: 'module/test/unit/java',
        ownershipFilePath: 'module/test/unit/java/java/resources/ownership.yaml',
        relative: 'module/test/unit/java/src/unit/fileTest.java',
        root: '/',
        testFile: true,
        testFolder: true,
        testKind: 'unit'
      });
    });
    it('java test file in StrictUnit Test module', function () {
      let rootFolder = '/';
      let relativeFileName = 'module/test/unit/java/src/strictunit/fileTest.java';
      assert.deepEqual(testAnalyser.verifyFileIsTest(rootFolder, relativeFileName), {
        ext: 'java',
        filename: 'fileTest',
        lang: 'java',
        module: 'module',
        modulePath: 'module/test/unit/java',
        ownershipFilePath: 'module/test/unit/java/java/resources/ownership.yaml',
        relative: 'module/test/unit/java/src/strictunit/fileTest.java',
        root: '/',
        testFile: true,
        testFolder: true,
        testKind: 'strictunit'
      });
    });
  });
});
