var
  assert = require('assert'),
  utils = require('../src/corUtils');


describe('utils', function() {
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
