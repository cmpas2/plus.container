const express = require('express');

const config = require('./config');
const log = (msg) => {console.log(msg)};
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json({limit: '5mb'}));

// invoke ioc container and bind request and response so they can be injected later
const ioc = require('./ioc')(config, log);
app.use((req, res, next) => {
  ioc
  .register('req', req)
  .register('res', res);

  console.log('set req and res');

  next();
});

// setup router
const router = require('./router')(ioc);
app.use('/', router);

const port = process.env.FH_PORT || process.env.OPENSHIFT_NODEJS_PORT || 8001;
const host = process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';
const server = app.listen(port, host, function () {
  console.log("App started at: " + new Date() + " on port: " + port);
});

// server.timeout = 240000;
server.on('connection', function (socket) {
  socket.setTimeout(4 * 60 * 1000);
});
