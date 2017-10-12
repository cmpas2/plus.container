const express = require('express');

const config = require('./config');
const log = (msg) => {
  console.log(msg);
};
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json({limit: '5mb'}));

// invoke ioc container
const ioc = require('./ioc')(config, log);

// setup router
const router = require('./router')(ioc);
app.use('/', router);

const server = app.listen(8001, 'localhost', function () {
  console.log('Listening on localhost:8001');
});

// server.timeout = 240000;
server.on('connection', function (socket) {
  socket.setTimeout(4 * 60 * 1000);
});
