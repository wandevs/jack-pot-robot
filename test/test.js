const assert = require('assert');
require('./lib/iwan_wanchain_test');

//run 'mocha spec.js'
// |
// spawn child process
// |
// |--------------> inside child process
//   process and apply options
//   |
//   run spec file/s
//   |
//   |--------------> per spec file
//     suite callbacks (e.g., 'describe')
//     |
//     'before' root-level pre-hook
//     |
//     'before' pre-hook
//     |
//     |--------------> per test
//       'beforeEach' root-level pre-hook
//       |
//       'beforeEach' pre-hook
//       |
//       test callbacks (e.g., 'it')
//       |
//       'afterEach' post-hook
//       |
//       'afterEach' root-level post-hook
//     |<-------------- per test end
//     |
//     'after' post-hook
//     |
//     'after' root-level post-hooks
//   |<-------------- per spec file end
// |<-------------- inside child process end
//

function add() {
  return Array.prototype.slice.call(arguments).reduce(function (prev, curr) {
    return prev + curr;
  }, 0);
}

describe.skip('add()', function () {
  var tests = [
    {args: [1, 2], expected: 3},
    {args: [1, 2, 3], expected: 6},
    {args: [1, 2, 3, 4], expected: 10}
  ];

  tests.forEach(function (test) {
    it('correctly adds ' + test.args.length + ' args', function() {
      console.log("dd");
      var res = add.apply(null, test.args);
      assert.equal(res, test.expected);
    });
  })
});

describe.skip('getBalance', function () {
  // Retry all tests in this suite up to 4 times
  this.retries(4);

  //////////////////////////////////////////////
  // hook
  before(function() {
    // runs once before the first test in this block
    console.log("before");
  });

  after(function() {
    // runs once after the last test in this block
    console.log("after");
  });

  beforeEach(function() {
    // runs before each test in this block
    console.log("beforeEach");
  });

  afterEach(function() {
    // runs after each test in this block
    console.log("afterEach");
  });
  it.only('should return -1 when the value is not present', async function (done) {
    // await
    console.log("it1");
    done();
  });
  it.only('should return -1 when the value is not present', async function () {
    // await
    // console.log("it2");
    this.skip();
  })
});
