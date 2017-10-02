const app = require('express')();

const endpoints = [
  {url: '/test', method: 'get', handler: 'Test'},
  {url: '/test', method: 'post', handler: 'TestPost'}
];

function Router(ioc){
  // expose endpoints and inject ioc container
  for(let i of endpoints){
    app[i.method](i.url, (req, res) => {
      try {
        let handled = ioc.get(i.handler);
        return defaultResponseHandler(null, handled, res);
      } catch (e) {
        return defaultResponseHandler(e, res);
      }
    });
  }
  return app;
}

module.exports = Router;

function defaultResponseHandler(err, handled, res){
  if(err){
    return res.send('BAD');
  } else {
    return res.send(handled.msg);
  }
}