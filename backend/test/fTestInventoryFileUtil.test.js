var
  assert = require('assert'),
  utils = require('../src/corUtils.js')
    // This is just to set logging to warnings level
    .warningsOnly(),
    fTestInventory = require('../src/utils/ftestInventory');

// Test Suites
describe('fTestInventory', function() {
  describe('#readAndVerifyInventoryFile()', function() {
    it('Simple Inventory file', function () {
      let rootFolder = './test-projects/';
      let fileName = 'ftest-inventory-sample.xml';
      let result = fTestInventory.readAndVerifyInventoryFile(rootFolder, fileName);
      assert.equal(result.success, true);
    });
  });
});
