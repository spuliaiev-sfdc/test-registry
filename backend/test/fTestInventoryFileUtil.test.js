var
  assert = require('assert'),
  utils = require('../src/corUtils.js')
    // This is just to set logging to warnings level
    .warningsOnly(),
  path = require('path'),
  fTestInventory = require('../src/utils/ftestInventory');

// Test Suites
describe('fTestInventory', function() {
  describe('#readAndVerifyInventoryFile()', function() {
    it('Simple Inventory file', function () {
      let rootFolder = './test-projects/javaProject/';
      let fileName = 'module01/test/func/java/src/some/production/folder/SimpleJavaTest.java';
      // let rootFolder = '/Users/spuliaiev/blt/app/main/core/';
      // let fileName = 'industries-mfg-rebates/test/func/java/src/industries/mfg/rebates/entities/rebatemember/RebateProgramMemberUpdateTest.java';
      let realFileInfo = utils.analyseFileLocation(rootFolder, fileName);
      let inventoryFile = fTestInventory.findInventoryFile(path.resolve(realFileInfo.root, realFileInfo.moduleRoot));
      let inventoryInfo = fTestInventory.readAndVerifyInventoryFile(realFileInfo, inventoryFile);
      assert.equal(inventoryInfo.success, true);
      assert.equal(inventoryInfo.filename, 'ftest-inventory.xml');
      assert.equal(!inventoryInfo.content, false);
    });
    it('Absent Inventory file for unit or strictunit tests', function () {
      let rootFolder = './test-projects/javaProject/';
      let fileName = 'module01/test/unit/java/src/unit/some/production/folder/SimpleJavaTest.java';
      let realFileInfo = utils.analyseFileLocation(rootFolder, fileName);
      let inventoryFile = fTestInventory.findInventoryFile(path.resolve(realFileInfo.root, realFileInfo.moduleRoot));
      let inventoryInfo = fTestInventory.readAndVerifyInventoryFile(realFileInfo, inventoryFile);
      assert.equal(inventoryInfo.success, true);
      assert.equal(inventoryInfo.content, null);
    });
  });
  describe('#findTestOwnershipInfo()', function() {
    it('Find a class', function () {
      let rootFolder = './test-projects/javaProject/';
      let fileName = 'module01/test/func/java/src/some/production/folder/SimpleJavaTest.java';
      let realFileInfo = utils.analyseFileLocation(rootFolder, fileName);
      let inventoryFile = fTestInventory.findInventoryFile(path.resolve(realFileInfo.root, realFileInfo.moduleRoot));
      let inventoryInfo = fTestInventory.readAndVerifyInventoryFile(realFileInfo, inventoryFile);
      assert.equal(inventoryInfo.success, true);
      assert.equal(inventoryInfo.filename, 'ftest-inventory.xml');

      let testClassName = 'some.production.folder.SimpleJavaTest';
      let classInventoryInfo = fTestInventory.findTestOwnershipInfo(inventoryInfo.content, testClassName);
      assert.equal(classInventoryInfo.success, true);
      assert.equal(classInventoryInfo.found, true);
      assert.deepEqual(classInventoryInfo.owners, {
        'FTEnvTeam_Main': [ 'FTestInventory category scrumteam' ]
      });
      assert.equal(classInventoryInfo.categoryPath, "Example Tests/TestsCategory01");
      assert.deepStrictEqual(classInventoryInfo.categoryElements, ['Example Tests', 'TestsCategory01']);
    });
    it('Wrong inventory object in regular project', function () {
      let inventoryInfo = fTestInventory.readAndVerifyInventoryFile({moduleRoot: "module_00", testKind: undefined}, undefined);
      assert.equal(inventoryInfo.success, true);
      assert.deepEqual(inventoryInfo.errors, []);
    });
    it('Wrong inventory object in regular project', function () {
      let inventoryInfo = fTestInventory.readAndVerifyInventoryFile({moduleRoot: "module_00", testKind: 'func'}, undefined);
      assert.equal(inventoryInfo.success, false);
      assert.deepEqual(inventoryInfo.errors, ['FTestInventory file not found for module module_00']);
    });
    it('Wrong inventory content', function () {
      let inventoryInfo = fTestInventory.readAndVerifyInventoryFile({moduleRoot: "module_00"}, {content: ''});
      assert.equal(inventoryInfo.success, false);
      assert.deepEqual(inventoryInfo.errors, ['FTestInventory file is empty for module undefined']);
    });
    it('Find a class with overrides in categories', function () {
      let rootFolder = './test-projects/javaProject/';
      let fileName = 'module01/test/func/java/src/some/production/folder/SecondJavaTest.java';
      let realFileInfo = utils.analyseFileLocation(rootFolder, fileName);
      let inventoryFile = fTestInventory.findInventoryFile(path.resolve(realFileInfo.root, realFileInfo.moduleRoot));
      let inventoryInfo = fTestInventory.readAndVerifyInventoryFile(realFileInfo, inventoryFile);
      assert.equal(inventoryInfo.success, true);
      assert.equal(inventoryInfo.filename, 'ftest-inventory.xml');

      let testClassName = 'some.production.folder.SecondJavaTest';
      let classInventoryInfo = fTestInventory.findTestOwnershipInfo(inventoryInfo.content, testClassName);
      assert.equal(classInventoryInfo.success, true);
      assert.equal(classInventoryInfo.found, true);
      assert.deepEqual(classInventoryInfo.owners, {
        'FTEnvTeam_Second': [ 'FTestInventory test scrumteam' ]
      });
      assert.equal(classInventoryInfo.categoryPath, "Example Tests/TestsCategory01");
      assert.deepStrictEqual(classInventoryInfo.categoryElements, ['Example Tests', 'TestsCategory01']);
    });
  });
});
