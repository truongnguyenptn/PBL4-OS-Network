var fs = require('fs');
var path = require('path');

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

var { refreshRSA,getRSAFromServer } = require('./Controller/rsa');

refreshRSA();

var {app} = require('./Init/AppInit');

var {io} = require('./Init/IOInit');

var options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

var server = require('https').createServer(options,app);

var {ioInit} = require('./Init/IOInit');

ioInit(server);

server.listen(4433);
