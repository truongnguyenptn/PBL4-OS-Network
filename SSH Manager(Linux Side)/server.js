var fs = require('fs');
var path = require('path');
var {app} = require('./Init/AppInit');
var http = require('http');
var https = require('https');
var options = {
  key: fs.readFileSync('key.pem', 'utf8'),
  cert: fs.readFileSync('cert.pem', 'utf8')
};

var server = https.createServer(options,app);

// var server = http.createServer(app);

// app.listen('4433', '0.0.0.0', () => console.log('Server running'));

server.listen('4443');