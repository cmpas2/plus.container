/* eslint-disable max-lines */
/* eslint-disable max-len */

describe('Container', function () {
  const Container = require('../../src/Container');
  let container;
  require('chai').should();

  beforeEach(function () {
    container = new Container();
  });

  it('should allow to register class: container.register("myService", function MyClass(){})', function () {
    const MyClass = function () {

    };
    container.register('myService', MyClass);
  });
});
