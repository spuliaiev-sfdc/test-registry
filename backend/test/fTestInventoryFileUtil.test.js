var
  assert = require('assert'),
  utils = require('../src/corUtils.js')
    // This is just to set logging to warnings level
    .warningsOnly(),
  path = require('path'),
  fTestInventory = require('../src/utils/ftestInventory');

// Async Testing utilities
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { expect } = chai;
chai.use(chaiAsPromised);

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
      return expect(
        fTestInventory.findTestOwnershipInfo(inventoryInfo, testClassName)
      ).to.eventually.be.fulfilled
        .then((classInventoryInfo) => {
          assert.equal(classInventoryInfo.success, true);
          assert.equal(classInventoryInfo.found, true);
          assert.deepEqual(classInventoryInfo.owners, [
            { name:'FTEnvTeam_Main', desc: ['FTestInventory category scrumteam'] }
          ]);
          assert.deepStrictEqual(classInventoryInfo.categoryElements, [
            'All functional tests',
            'Example Tests',
            'TestsCategory01'
          ]);
        });
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
      return expect(
        fTestInventory.findTestOwnershipInfo(inventoryInfo, testClassName)
      ).to.eventually.be.fulfilled
        .then((classInventoryInfo) => {
          assert.equal(classInventoryInfo.success, true);
          assert.equal(classInventoryInfo.found, true);
          assert.deepEqual(classInventoryInfo.owners, [
            { name: 'FTEnvTeam_Second', desc: ['FTestInventory test scrumteam'] }
          ]);
          assert.deepStrictEqual(classInventoryInfo.categoryElements, [
            'All functional tests',
            'Example Tests',
            'TestsCategory01'
          ]);
        });
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
      return expect(
        fTestInventory.findTestOwnershipInfo(inventoryInfo, onClassInInventory)
      ).to.eventually.be.fulfilled
        .then((classInventoryInfo) => {
          assert.equal(classInventoryInfo.success, true);
          assert.deepEqual(classesFound, [
            {
              "categoryInfo": {
                "categoryElements": [
                  "All functional tests",
                  "Example Tests"
                ],
                "scrumTeam": undefined
              },
              "className": "some.production.folder.ThirdJavaTest",
              "scrumTeam": undefined,
              "source": "category"
            },
            {
              "categoryInfo": {
                "categoryElements": [
                  "All functional tests",
                  "Example Tests",
                  "TestsCategory01"
                ],
                "scrumTeam": "FTEnvTeam_Main"
              },
              "className": "some.production.folder.SimpleJavaTest",
              "scrumTeam": "FTEnvTeam_Main",
              "source": "category"
            },
            {
              "categoryInfo": {
                "categoryElements": [
                  "All functional tests",
                  "Example Tests",
                  "TestsCategory01"
                ],
                "scrumTeam": "FTEnvTeam_Main"
              },
              "className": "some.production.folder.SecondJavaTest",
              "scrumTeam": "FTEnvTeam_Second",
              "source": "test"
            },
            {
              "categoryInfo": {
                "categoryElements": [
                  "All functional tests",
                  "Example Tests Group OTHER 2"
                ],
                "scrumTeam": undefined,
              },
              "className": "some.production.folder.OtherSimpleJavaTest",
              "scrumTeam": undefined,
              "source": "category"
            },
            {
              "categoryInfo": {
                "categoryElements": [
                  "All functional tests",
                  "Example Tests Group OTHER 2",
                  "TestsCategory Group OTHER 01 in 02"
                ],
                "scrumTeam": "FTEnvTeam_Third_Other"
              },
              "className": "some.production.folder.OtherSimpleJavaTest",
              "scrumTeam": "FTEnvTeam_Third_Other",
              "source": "category"
            },
            {
              "categoryInfo": {
                "categoryElements": [
                  "All functional tests",
                  "Example Tests Group OTHER 2",
                  "TestsCategory Group OTHER 01 in 02"
                ],
                "scrumTeam": "FTEnvTeam_Third_Other"
              },
              "className": "some.production.folder.OtherSecondJavaTest",
              "scrumTeam": "FTEnvTeam_Second_Other",
              "source": "test"
            }
          ]);
        });
    });
    describe('#readAndVerifyInventoryFile()', function() {
      it('Simple Inventory file', function () {
        let rootFolder = './test-projects/javaProject/';
        let foundInventoryFiles = [];
        let runInfo = {
          rootFolder: rootFolder,
          module: undefined,
          errors: [],
          callbackOnFile: function (runInfo, fileInfo) {
            console.log(`callbackOnFile ${fileInfo.relative}`);
            foundInventoryFiles.push(fileInfo.relative);
          }
        }

        return expect(
          fTestInventory.enumerateAllTests(runInfo)
        ).to.eventually.be.fulfilled
          .then((inventoryInfo) => {
            assert.equal(inventoryInfo.success, true);
            assert.deepEqual(foundInventoryFiles, [
              'module01/test/func/ftest-inventory.xml',
              'module01/test/func/other-ftests.xml'
            ]);
          });
      });
    });
    it('Simple Inventory file with reports', function () {
      let rootFolder = './test-projects/javaProject/';
      let foundInventoryFiles = [];
      let foundReports = [];
      let foundTests = [];
      let runInfo = {
        rootFolder: rootFolder,
        module: undefined,
        errors: [],
        callbackOnFile: function (runInfo, fileInfo) {
          console.log(`callbackOnFile ${fileInfo.relative}`);
          foundInventoryFiles.push(fileInfo.relative);
        },
        onTestFound: function (runInfo, fileInfo, className, categoryInfo, scrumTeam, source) {
          console.log(`onTestFound ${className} in ${fileInfo.relative} as ${scrumTeam} in ${categoryInfo.categoryElements.join("/")}`);
          foundTests.push({
            className,
            scrumTeam,
            categoryElements: categoryInfo.categoryElements
          })
        },
        onReportGenerated: function (fileInfo) {
          if (fileInfo.report) {
            console.log(`callbackOnFile ${fileInfo.relative}`);
            foundReports.push(fileInfo.relative);
          }
        }
      }

      return expect(
        fTestInventory.enumerateAllTests(runInfo)
      ).to.eventually.be.fulfilled
        .then((inventoryInfo) => {
          assert.equal(inventoryInfo.success, true);
          assert.deepEqual(foundInventoryFiles, [
            'module01/test/func/ftest-inventory.xml',
            'module01/test/func/other-ftests.xml'
          ]);
          assert.deepEqual(foundTests, [
            {
              "categoryElements": [
                "All functional tests",
                "Example Tests"
              ],
              "className": "some.production.folder.ThirdJavaTest",
              "scrumTeam": undefined
            },
            {
              "categoryElements": [
                "All functional tests",
                "Example Tests",
                "TestsCategory01"
              ],
              "className": "some.production.folder.SimpleJavaTest",
              "scrumTeam": "FTEnvTeam_Main"
            },
            {
              "categoryElements": [
                "All functional tests",
                "Example Tests",
                "TestsCategory01"
              ],
              "className": "some.production.folder.SecondJavaTest",
              "scrumTeam": "FTEnvTeam_Second"
            },
            {
              "categoryElements": [
                "All functional tests",
                "Example Tests Group OTHER 2"
              ],
              "className": "some.production.folder.OtherSimpleJavaTest",
              "scrumTeam": undefined
            },
            {
              "categoryElements": [
                "All functional tests",
                "Example Tests Group OTHER 2",
                "TestsCategory Group OTHER 01 in 02"
              ],
              "className": "some.production.folder.OtherSimpleJavaTest",
              "scrumTeam": "FTEnvTeam_Third_Other"
            },
            {
              "categoryElements": [
                "All functional tests",
                "Example Tests Group OTHER 2",
                "TestsCategory Group OTHER 01 in 02"
              ],
              "className": "some.production.folder.OtherSecondJavaTest",
              "scrumTeam": "FTEnvTeam_Second_Other"
            },
            {
              "categoryElements": [
                "All functional tests_ADD",
                "Example Tests_ADD"
              ],
              "className": "some.production.additional.ThirdJavaTest",
              "scrumTeam": undefined
            },
            {
              "categoryElements": [
                "All functional tests_ADD",
                "Example Tests_ADD",
                "TestsCategory01_ADD"
              ],
              "className": "some.production.additional.SimpleJavaTest",
              "scrumTeam": "FTEnvTeam_Main_ADD"
            },
            {
              "categoryElements": [
                "All functional tests_ADD",
                "Example Tests_ADD",
                "TestsCategory01_ADD"
              ],
              "className": "some.production.additional.SecondJavaTest",
              "scrumTeam": "FTEnvTeam_Second"
            },
            {
              "categoryElements": [
                "All functional tests_ADD",
                "Example Tests Group OTHER 2_ADD"
              ],
              "className": "some.production.additional.OtherSimpleJavaTest",
              "scrumTeam": undefined,
            },
            {
              "categoryElements": [
                "All functional tests_ADD",
                "Example Tests Group OTHER 2_ADD",
                "TestsCategory Group OTHER 01 in 02_ADD"
              ],
              "className": "some.production.additional.OtherSimpleJavaTest",
              "scrumTeam": "FTEnvTeam_Third_Other_ADD"
            },
            {
              "categoryElements": [
                "All functional tests_ADD",
                "Example Tests Group OTHER 2_ADD",
                "TestsCategory Group OTHER 01 in 02_ADD"
              ],
              "className": "some.production.additional.OtherSecondJavaTest",
              "scrumTeam": "FTEnvTeam_Second_Other_ADD"
            }
          ]);
        });
    });
  });
});
