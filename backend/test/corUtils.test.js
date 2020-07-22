var
  assert = require('assert'),
  utils = require('../src/corUtils.js')
    // This is just to set logging to warnings level
    .warningsOnly();


describe('corUtils', function() {
  describe('#getFileExtension()', function() {
    it('Evaluate different cases', function () {
      assert.equal(utils.getFileExtension(''), '');
      assert.equal(utils.getFileExtension('name'), '');
      assert.equal(utils.getFileExtension('name.txt'), 'txt');
      assert.equal(utils.getFileExtension('.htpasswd'), '');
      assert.equal(utils.getFileExtension('name.with.many.dots.myext'), 'myext');
    });
  });
  describe('#getFileNameNoExt()', function() {
    it('Evaluate different cases', function () {
      assert.equal(utils.getFileNameNoExt(''), '');
      assert.equal(utils.getFileNameNoExt('name'), 'name');
      assert.equal(utils.getFileNameNoExt('name.txt'), 'name');
      assert.equal(utils.getFileNameNoExt('.htpasswd'), '.htpasswd');
      assert.equal(utils.getFileNameNoExt('name.with.many.dots.myext'), 'name.with.many.dots');
    });
  });
  describe('#analyseFileLocation()', function() {
    it('Check for xml file', function () {
      let result = utils.analyseFileLocation('~/blt/app/main/core', 'moduleName/java/src/data/report.xml');
      assert.deepEqual(result , {
        root: '~/blt/app/main/core',
        relative: 'moduleName/java/src/data/report.xml',
        module: 'moduleName',
        modulePath: 'moduleName',
        moduleRoot: 'moduleName',
        moduleSrcPath: 'moduleName/java/src',
        relative: 'moduleName/java/src/data/report.xml',
        relativeToModuleRoot: 'java/src/data/report.xml',
        relativeToModuleSrc: 'data/report.xml',
        ext: 'xml',
        filename: 'report',
        testFolder: false
      });
    });
    it('Check for java prod file', function () {
      let result = utils.analyseFileLocation('~/blt/app/main/core', 'moduleName/java/src/ui/mod/impl/overrides/lists/ClassWithLogic.java');
      assert.deepEqual(result , {
        ext: 'java',
        filename: 'ClassWithLogic',
        module: 'moduleName',
        modulePath: 'moduleName',
        moduleRoot: 'moduleName',
        moduleSrcPath: 'moduleName/java/src',
        relative: 'moduleName/java/src/ui/mod/impl/overrides/lists/ClassWithLogic.java',
        relativeToModuleRoot: 'java/src/ui/mod/impl/overrides/lists/ClassWithLogic.java',
        relativeToModuleSrc: 'ui/mod/impl/overrides/lists/ClassWithLogic.java',
        javaClassFQN: 'ui.mod.impl.overrides.lists.ClassWithLogic',
        root: '~/blt/app/main/core',
        testFolder: false,
      });
    });
    it('Check for java func test file', function () {
      let result = utils.analyseFileLocation('~/blt/app/main/core', 'moduleName/test/func/java/src/pk1/pk2/ClassWithOtherLogicTest.java');
      assert.deepEqual(result , {
        ext: 'java',
        filename: 'ClassWithOtherLogicTest',
        module: 'moduleName',
        modulePath: 'moduleName',
        moduleRoot: 'moduleName/test/func',
        moduleSrcPath: 'moduleName/test/func/java/src',
        relative: 'moduleName/test/func/java/src/pk1/pk2/ClassWithOtherLogicTest.java',
        relativeToModuleRoot: 'java/src/pk1/pk2/ClassWithOtherLogicTest.java',
        relativeToModuleSrc: 'pk1/pk2/ClassWithOtherLogicTest.java',
        javaClassFQN: 'pk1.pk2.ClassWithOtherLogicTest',
        root: '~/blt/app/main/core',
        testFolder: true,
        testKind: 'func'
      });
    });
    it('Check for java unit test file', function () {
      let result = utils.analyseFileLocation('~/blt/app/main/core', 'moduleName/test/unit/java/src/unit/pk1/pk2/StrinctUnitClassWithOtherLogicTest.java');

      assert.deepEqual(result , {
        ext: 'java',
        filename: 'StrinctUnitClassWithOtherLogicTest',
        module: 'moduleName',
        modulePath: 'moduleName',
        moduleRoot: 'moduleName/test/unit',
        moduleSrcPath: 'moduleName/test/unit/java/src/unit',
        relative: 'moduleName/test/unit/java/src/unit/pk1/pk2/StrinctUnitClassWithOtherLogicTest.java',
        relativeToModuleRoot: 'java/src/unit/pk1/pk2/StrinctUnitClassWithOtherLogicTest.java',
        relativeToModuleSrc: 'pk1/pk2/StrinctUnitClassWithOtherLogicTest.java',
        javaClassFQN: 'pk1.pk2.StrinctUnitClassWithOtherLogicTest',
        root: '~/blt/app/main/core',
        testFolder: true,
        testKind: 'unit'
      });
    });
    it('Check for java strictunit test file', function () {
      let result = utils.analyseFileLocation('~/blt/app/main/core', 'moduleName/test/unit/java/src/strictunit/pk1/pk2/StrinctUnitClassWithOtherLogicTest.java');

      assert.deepEqual(result , {
          ext: 'java',
          filename: 'StrinctUnitClassWithOtherLogicTest',
          module: 'moduleName',
          modulePath: 'moduleName',
          moduleRoot: 'moduleName/test/unit',
          moduleSrcPath: 'moduleName/test/unit/java/src/strictunit',
          relative: 'moduleName/test/unit/java/src/strictunit/pk1/pk2/StrinctUnitClassWithOtherLogicTest.java',
          relativeToModuleRoot: 'java/src/strictunit/pk1/pk2/StrinctUnitClassWithOtherLogicTest.java',
          relativeToModuleSrc: 'pk1/pk2/StrinctUnitClassWithOtherLogicTest.java',
          javaClassFQN: 'pk1.pk2.StrinctUnitClassWithOtherLogicTest',
          root: '~/blt/app/main/core',
          testFolder: true,
          testKind: 'strictunit'
      });
    });
    it('Check for java func test file without test parent folder', function () {
      let result = utils.analyseFileLocation('~/blt/app/main/core', 'module-test/func/java/src/pk1/pk2/ClassWithOtherLogicTest.java');
      assert.deepEqual(result , {
        ext: 'java',
        filename: 'ClassWithOtherLogicTest',
        module: 'module-test',
        modulePath: 'module-test',
        moduleRoot: 'module-test/func',
        moduleSrcPath: 'module-test/func/java/src',
        relative: 'module-test/func/java/src/pk1/pk2/ClassWithOtherLogicTest.java',
        relativeToModuleRoot: 'java/src/pk1/pk2/ClassWithOtherLogicTest.java',
        relativeToModuleSrc: 'pk1/pk2/ClassWithOtherLogicTest.java',
        javaClassFQN: 'pk1.pk2.ClassWithOtherLogicTest',
        root: '~/blt/app/main/core',
        testFolder: true,
        testKind: 'func'
      });
    });
  });
  describe('#addTagInfo()', function() {
    it('Add to empty owners', function () {
      assert.deepEqual(utils.addTagInfo('Team_01', 'Desc_01'),
        [{
            desc: ['Desc_01'],
            name: 'Team_01'
        }]
      );
    });
    it('Add undefined Tag to empty owners', function () {
      let initial = utils.addTagInfo('Team_01', 'Desc_01');
      assert.deepEqual(utils.addTagInfo(initial, undefined, 'Desc_02'),
        [{
          desc: ['Desc_01'],
          name: 'Team_01'
        }]
      );
    });
    it('Add new Tag to owners', function () {
      let initial = utils.addTagInfo('Team_01', 'Desc_01');
      assert.deepEqual(utils.addTagInfo(initial, 'Team_02', 'Desc_02'),
        [{
          desc: ['Desc_01'],
          name: 'Team_01'
        },{
          desc: ['Desc_02'],
          name: 'Team_02'
        }]
      );
    });
    it('Add same Tag to owners with new description', function () {
      let initial = utils.addTagInfo('Team_01', 'Desc_01');
      assert.deepEqual(utils.addTagInfo(initial, 'Team_01', 'Desc_02'),
        [{
          desc: ['Desc_01','Desc_02'],
          name: 'Team_01'
        }]);
    });
    it('Add same multi Tags to owners with new description', function () {
      let initial = utils.addTagInfo('Team_01', 'Desc_01');
      assert.deepEqual(utils.addTagInfo(initial, ['Team_01', 'Team_02'] , 'Desc_02'),
        [{
          desc: ['Desc_01','Desc_02'],
          name: 'Team_01'
        },{
          desc: ['Desc_02'],
          name: 'Team_02'
        }]);
    });
    it('Add same Tag to owners with new multiple descriptions', function () {
      let initial = utils.addTagInfo('Team_01', 'Desc_01');
      assert.deepEqual(utils.addTagInfo(initial, 'Team_01', ['Desc_02', 'Desc_03']),
        [{
          desc: ['Desc_01','Desc_02','Desc_03'],
          name: 'Team_01'
        }]);
    });
    it('Add a map of Tags to owners', function () {
      assert.deepEqual(utils.addTagInfo(
          // Existing team
        [{
          desc: ['Desc_01'],
          name: 'Team_01'
        }]
        , // Adding team
        [{
          desc: ['Desc_02'],
          name: 'Team_02'
        },{
          desc: ['Desc_03'],
          name: 'Team_03'
        }]
        ), // Result team
        [{
          desc: ['Desc_01'],
          name: 'Team_01'
        },{
          desc: ['Desc_02'],
          name: 'Team_02'
        },{
          desc: ['Desc_03'],
          name: 'Team_03'
        }]);
    });
    it('Add a map of Tags to owners, with one preexisting', function () {
      let initial = utils.addTagInfo('Team_01', 'Desc_01');
      assert.deepEqual(utils.addTagInfo(initial
        , // Adding team
        {
          'Team_01': ['Desc_01_02'],
          'Team_02': ['Desc_02'],
          'Team_03': ['Desc_03']
        }
        ), // Result team
        [{
          desc: ['Desc_01','Desc_01_02'],
          name: 'Team_01'
        },{
          desc: ['Desc_02'],
          name: 'Team_02'
        },{
          desc: ['Desc_03'],
          name: 'Team_03'
        }]);
    });
  });
  describe('#isPathMoreSpecific()', function() {
    it('should match the wild-chars at the end. Basic', function() {
      assert.equal(utils.isPathMoreSpecific('/a', '/*'), true);
      assert.equal(utils.isPathMoreSpecific('/*', '/a'), false);
    });
    it('should match the wild-chars at the end. Sample', function() {
      assert.equal(utils.isPathMoreSpecific('java/src/bar/Baz.java', 'java/src/bar/*'), true);
      assert.equal(utils.isPathMoreSpecific('java/src/bar/*', 'java/src/bar/**'), true);
      assert.equal(utils.isPathMoreSpecific('java/src/bar/**', 'java/src/**'), true);
      assert.equal(utils.isPathMoreSpecific('java/src/**', 'java/**'), true);
      assert.equal(utils.isPathMoreSpecific('java/**', '**'), true);
    });
    it('should match the wild-chars at the end. Sample reversed', function() {
      assert.equal(utils.isPathMoreSpecific('java/src/bar/*', 'java/src/bar/Baz.java'), false);
      assert.equal(utils.isPathMoreSpecific('java/src/bar/**', 'java/src/bar/*'), false);
      assert.equal(utils.isPathMoreSpecific('java/src/*', 'java/src/bar/**'), false);
      assert.equal(utils.isPathMoreSpecific('java/**', 'java/src/**'), false);
      assert.equal(utils.isPathMoreSpecific( '**', 'java/**'), false);
    });
    it('should match the wild-chars at the end. Real', function() {
      assert.equal(utils.isPathMoreSpecific('java/src/strictunit/sales/opportunity/team/AccountTeamConfirmDeleteUnitTest.java', 'java/src/strictunit/sales/opportunity/**'), true);
      assert.equal(utils.isPathMoreSpecific('java/src/strictunit/sales/opportunity/**', 'java/src/strictunit/sales/opportunity/team/AccountTeamConfirmDeleteUnitTest.java'), false);
    });
  });
});
