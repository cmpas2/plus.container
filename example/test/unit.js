/* eslint-disable max-lines */
/* eslint-disable max-len */

describe('Container', function () {
  const Container = require('../../src/Container');
  let container;
  require('chai').should();

  beforeEach(function () {
    container = new Container();
  });

  it('should allow request body to be injected into a parent container registry instance', function () {
    const req = () => {
      return {
        body: {
          msg: 'Testing worked'
        }
      };
    };

    const test = (req) => {
      return req.body;
    };

    const parent = new Container();

    parent.register('test', test, ['req']);

    const child = new Container();

    child.register('parent', parent);

    child.register('req', req);

    const action = child.get('test');

    action.msg.should.be.equal('Testing worked');


  });
});
