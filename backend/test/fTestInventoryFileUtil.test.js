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
    it('Find all test classes in inventory', function () {
      let rootFolder = './test-projects/javaProject/';
      let fileName = 'module01/test/func/java/src/some/production/folder/SimpleJavaTest.java';
      let realFileInfo = utils.analyseFileLocation(rootFolder, fileName);
      let inventoryFile = fTestInventory.findInventoryFile(path.resolve(realFileInfo.root, realFileInfo.moduleRoot));
      let inventoryInfo = fTestInventory.readAndVerifyInventoryFile(realFileInfo, inventoryFile);
      assert.equal(inventoryInfo.success, true);
      assert.equal(inventoryInfo.filename, 'ftest-inventory.xml');

      let testClassName = 'some.production.folder.SimpleJavaTest';
      let classesFound = [];
      function onClassInInventory(className, categoryInfo, scrumTeam, source) {
        classesFound.push({className, scrumTeam, source, categoryInfo });
        return false;
      }
      let classInventoryInfo = fTestInventory.findTestOwnershipInfo(inventoryInfo.content, onClassInInventory);
      assert.equal(classInventoryInfo.success, true);
      assert.deepEqual(classesFound, [
        {
          "categoryInfo": {
            "categoryElements": [
              "TestsCategory Group OTHER 01 in 02",
              "Example Tests Group OTHER 2",
              "TestsCategory01",
              "Example Tests",
              "All functional tests"
            ],
            "categoryPath": "Example Tests/All functional tests",
            "scrumTeam": undefined
          },
          "className": "some.production.folder.ThirdJavaTest",
          "scrumTeam": undefined,
          "source": "category"
        },
        {
          "categoryInfo": {
            "categoryElements": [
              "TestsCategory Group OTHER 01 in 02",
              "Example Tests Group OTHER 2",
              "TestsCategory01",
              "Example Tests",
              "All functional tests"
            ],
            "categoryPath": "TestsCategory01/Example Tests/All functional tests",
            "scrumTeam": "FTEnvTeam_Main"
          },
          "className": "some.production.folder.SimpleJavaTest",
          "scrumTeam": undefined,
          "source": "category"
        },
        {
          "categoryInfo": {
            "categoryElements": [
              "TestsCategory Group OTHER 01 in 02",
              "Example Tests Group OTHER 2",
              "TestsCategory01",
              "Example Tests",
              "All functional tests"
            ],
            "categoryPath": "TestsCategory01/Example Tests/All functional tests",
            "scrumTeam": "FTEnvTeam_Main"
          },
          "className": "some.production.folder.SecondJavaTest",
          "scrumTeam": "FTEnvTeam_Second",
          "source": "test"
        },
        {
          "categoryInfo": {
            "categoryElements": [
              "TestsCategory Group OTHER 01 in 02",
              "Example Tests Group OTHER 2",
              "TestsCategory01",
              "Example Tests",
              "All functional tests"
            ],
            "categoryPath": "Example Tests Group OTHER 2/All functional tests",
            "scrumTeam": undefined
          },
          "className": "some.production.folder.OtherSimpleJavaTest",
          "scrumTeam": undefined,
          "source": "category"
        },
        {
          "categoryInfo": {
            "categoryElements": [
              "TestsCategory Group OTHER 01 in 02",
              "Example Tests Group OTHER 2",
              "TestsCategory01",
              "Example Tests",
              "All functional tests"
            ],
            "categoryPath": "TestsCategory Group OTHER 01 in 02/Example Tests Group OTHER 2/All functional tests",
            "scrumTeam": "FTEnvTeam_Third_Other"
          },
          "className": "some.production.folder.OtherSimpleJavaTest",
          "scrumTeam": undefined,
          "source": "category"
        },
        {
          "categoryInfo": {
            "categoryElements": [
              "TestsCategory Group OTHER 01 in 02",
              "Example Tests Group OTHER 2",
              "TestsCategory01",
              "Example Tests",
              "All functional tests"
            ],
            "categoryPath": "TestsCategory Group OTHER 01 in 02/Example Tests Group OTHER 2/All functional tests",
            "scrumTeam": "FTEnvTeam_Third_Other"
          },
          "className": "some.production.folder.OtherSecondJavaTest",
          "scrumTeam": "FTEnvTeam_Second_Other",
          "source": "test"
        }
      ]);
    });
    describe('#readAndVerifyInventoryFile()', function() {
      it('Simple Inventory file', function () {
        let rootFolder = './test-projects/javaProject/';
        let fileName = 'module01/test/func/java/src/some/production/folder/SimpleJavaTest.java';
        let realFileInfo = utils.analyseFileLocation(rootFolder, fileName);
        let inventoryInfo = fTestInventory.enumerateAllTests(realFileInfo);
        assert.equal(inventoryInfo.success, true);
        assert.equal(inventoryInfo.filename, 'ftest-inventory.xml');
        assert.equal(!inventoryInfo.content, false);
      });
    });
  });
});
