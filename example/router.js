const app = require('express')();

const endpoints = [
  {url: '/test', method: 'get', handler: 'Test'},
  {url: '/test', method: 'post', handler: 'TestPost'}
];

/**
 * 
 * @param {*} ioc 
 * @return {*}
 */
function Router(ioc) {
  // expose endpoints and inject ioc container
  for (let i of endpoints) {
    app[i.method](i.url, (req, res) => {
      try {
        const reqContainer = createRequestContainer(ioc, req, res);
        let handled = reqContainer.get(i.handler);
        return defaultResponseHandler(null, handled, res);
      } catch (e) {
        console.log(e);
        //return defaultResponseHandler(e, res);
      }
    });
  }
  return app;
}

module.exports = Router;

/**
 * 
 * @param {*} err 
 * @param {*} handled 
 * @param {*} res
 * @return {*}
 */
function defaultResponseHandler(err, handled, res) {
  if (err) {
    return res.send('BAD');
  } else {
    return res.send(handled.msg);
  }
}


/**
 * Creates a extended container for this request so we can package for use
 * @param {Ioc} ioc
 * @param {Express.Request} req
 * @param {Express.Response} res
 * @return {Ioc}
 */
function createRequestContainer(ioc, req, res) {
  const IocFactory = require('../src/Container');
  const requestIoc = IocFactory.create();

  requestIoc
    .register('parent', ioc)
    .register('req', req)
    .register('res', res)
  ;

  return requestIoc;
}
