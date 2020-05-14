const assert = require('assert');

// run 'mocha spec.js'
// |
// spawn child process
// |
// |--------------> inside child process
//    process and apply options
// |
// run spec file/s
// |
// |--------------> per spec file
// suite callbacks (e.g., 'describe')
// |
// 'before' root-level pre-hook
// |
// 'before' pre-hook
// |
// |--------------> per test
// 'beforeEach' root-level pre-hook
// |
// 'beforeEach' pre-hook
// |
// test callbacks (e.g., 'it')
// |
// 'afterEach' post-hook
// |
// 'afterEach' root-level post-hook
// |<-------------- per test end
// |
// 'after' post-hook
// |
// 'after' root-level post-hooks
// |<-------------- per spec file end
// |<-------------- inside child process end

describe('Wan Chain', function () {
  describe('getBalance', function () {
    it('should return -1 when the value is not present', function () {
      assert.equal([1,2,3].indexOf(4), -1);
    })
  })
});
