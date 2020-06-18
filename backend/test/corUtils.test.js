var
  assert = require('assert'),
  utils = require('../src/corUtils.js')
    // This is just to set logging to warnings level
    .warningsOnly();


describe('corUtils', function() {
  describe('#getFileExtension()', function() {
    it('Evaluate different cases', function () {
      assert.equal(utils.getFileExtension(""), "");
      assert.equal(utils.getFileExtension("name"), "");
      assert.equal(utils.getFileExtension("name.txt"), "txt");
      assert.equal(utils.getFileExtension(".htpasswd"), "");
      assert.equal(utils.getFileExtension("name.with.many.dots.myext"), "myext");
    });
  });
  describe('#getFileNameNoExt()', function() {
    it('Evaluate different cases', function () {
      assert.equal(utils.getFileNameNoExt(""), "");
      assert.equal(utils.getFileNameNoExt("name"), "name");
      assert.equal(utils.getFileNameNoExt("name.txt"), "name");
      assert.equal(utils.getFileNameNoExt(".htpasswd"), ".htpasswd");
      assert.equal(utils.getFileNameNoExt("name.with.many.dots.myext"), "name.with.many.dots");
    });
  });
  describe('#analyseFileLocation()', function() {
    it('Check for xml file', function () {
      let result = utils.analyseFileLocation("~/blt/app/main/core", "moduleName/java/src/data/report.xml");
      assert.deepEqual(result , {
        "root": "~/blt/app/main/core",
        "relative": "moduleName/java/src/data/report.xml",
        "module": "moduleName",
        "modulePath": "moduleName",
        "ext": "xml",
        "filename": "report",
        "testFolder": false,
        "ownershipFilePath": "moduleName/java/resources/ownership.yaml"
      });
    });
    it('Check for java prod file', function () {
      let result = utils.analyseFileLocation("~/blt/app/main/core", "moduleName/java/src/ui/mod/impl/overrides/lists/ClassWithLogic.java");
      assert.deepEqual(result , {
        "root": "~/blt/app/main/core",
        "relative": "moduleName/java/src/ui/mod/impl/overrides/lists/ClassWithLogic.java",
        "module": "moduleName",
        "modulePath": "moduleName",
        "ext": "java",
        "filename": "ClassWithLogic",
        "testFolder": false,
        "ownershipFilePath": "moduleName/java/resources/ownership.yaml"
      });
    });
    it('Check for java func test file', function () {
      let result = utils.analyseFileLocation("~/blt/app/main/core", "moduleName/test/func/java/src/pk1/pk2/ClassWithOtherLogicTest.java");
      assert.deepEqual(result , {
        "root": "~/blt/app/main/core",
        "relative": "moduleName/test/func/java/src/pk1/pk2/ClassWithOtherLogicTest.java",
        "module": "moduleName",
        "modulePath": "moduleName/test/func/java",
        "ext": "java",
        "filename": "ClassWithOtherLogicTest",
        "testFolder": true,
        "testKind": "func",
        "ownershipFilePath": "moduleName/test/func/java/java/resources/ownership.yaml"
      });
    });
    it('Check for java unit test file', function () {
      let result = utils.analyseFileLocation("~/blt/app/main/core", "moduleName/test/unit/java/src/unit/pk1/pk2/StrinctUnitClassWithOtherLogicTest.java");

      assert.deepEqual(result , {
        "root": "~/blt/app/main/core",
        "relative": "moduleName/test/unit/java/src/unit/pk1/pk2/StrinctUnitClassWithOtherLogicTest.java",
        "module": "moduleName",
        "modulePath": "moduleName/test/unit/java",
        "ext": "java",
        "filename": "StrinctUnitClassWithOtherLogicTest",
        "testFolder": true,
        "testKind": "unit",
        "ownershipFilePath": "moduleName/test/unit/java/java/resources/ownership.yaml"
      });
    });
    it('Check for java strictunit test file', function () {
      let result = utils.analyseFileLocation("~/blt/app/main/core", "moduleName/test/unit/java/src/strictunit/pk1/pk2/StrinctUnitClassWithOtherLogicTest.java");

      assert.deepEqual(result , {
        "root": "~/blt/app/main/core",
        "relative": "moduleName/test/unit/java/src/strictunit/pk1/pk2/StrinctUnitClassWithOtherLogicTest.java",
        "module": "moduleName",
        "modulePath": "moduleName/test/unit/java",
        "ext": "java",
        "filename": "StrinctUnitClassWithOtherLogicTest",
        "testFolder": true,
        "testKind": "strictunit",
        "ownershipFilePath": "moduleName/test/unit/java/java/resources/ownership.yaml"
      });
    });
  });
  describe('#isPathMoreSpecific()', function() {
    it('should match the wild-chars at the end. Basic', function() {
      assert.equal(utils.isPathMoreSpecific("/a", '/*'), true);
      assert.equal(utils.isPathMoreSpecific("/*", '/a'), false);
    });
    it('should match the wild-chars at the end. Sample', function() {
      assert.equal(utils.isPathMoreSpecific("java/src/bar/Baz.java", 'java/src/bar/*'), true);
      assert.equal(utils.isPathMoreSpecific("java/src/bar/*", 'java/src/bar/**'), true);
      assert.equal(utils.isPathMoreSpecific("java/src/bar/**", 'java/src/**'), true);
      assert.equal(utils.isPathMoreSpecific("java/src/**", 'java/**'), true);
      assert.equal(utils.isPathMoreSpecific("java/**", '**'), true);
    });
    it('should match the wild-chars at the end. Sample reversed', function() {
      assert.equal(utils.isPathMoreSpecific('java/src/bar/*', "java/src/bar/Baz.java"), false);
      assert.equal(utils.isPathMoreSpecific("java/src/bar/**", 'java/src/bar/*'), false);
      assert.equal(utils.isPathMoreSpecific('java/src/*', "java/src/bar/**"), false);
      assert.equal(utils.isPathMoreSpecific('java/**', "java/src/**"), false);
      assert.equal(utils.isPathMoreSpecific( '**', "java/**"), false);
    });
    it('should match the wild-chars at the end. Real', function() {
      assert.equal(utils.isPathMoreSpecific("java/src/strictunit/sales/opportunity/team/AccountTeamConfirmDeleteUnitTest.java", 'java/src/strictunit/sales/opportunity/**'), true);
      assert.equal(utils.isPathMoreSpecific('java/src/strictunit/sales/opportunity/**', "java/src/strictunit/sales/opportunity/team/AccountTeamConfirmDeleteUnitTest.java"), false);
    });
  });
});
