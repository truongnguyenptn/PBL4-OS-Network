var SSHClient = require('ssh2').Client;
const { getRSA,decryptRSA,decryptRSAFromBufferArray } = require('.././Controller/rsa.js');

const { SSHServer } = require('.././getConfig.js');

function ioInit(server){
  var io = require('socket.io')(server);

  io.on('connection', function(socket) {
    
    
    (async () =>{
      try{
        const ip = socket.handshake.address;
        const rsa = await getRSA(ip);

        var encryptedBufferJSONString = socket.handshake.query.encrypted;
        var encryptedBufferJSONArray = JSON.parse(encryptedBufferJSONString);
        var bufferArray = [];
        for(i = 0;i<encryptedBufferJSONArray.length;i++){
          bufferArray.push(new Buffer.from(encryptedBufferJSONArray[i]));
        }
        var decryptedString = decryptRSAFromBufferArray(bufferArray,rsa.privateKey);
        var query = JSON.parse(decryptedString);

        //console.log(query);
        var conn = new SSHClient();
        conn.on('ready', function() {
          socket.emit('data', '\r\n*** SSH CONNECTION ESTABLISHED ***\r\n');
          conn.shell(function(err, stream) {
            if (err)
              return socket.emit('data', '\r\n*** SSH SHELL ERROR: ' + err.message + ' ***\r\n');
            socket.on('data', function(data) {
              stream.write(data);
            });
            stream.on('data', function(d) {
              socket.emit('data', d.toString('binary'));
            }).on('close', function() {
              conn.end();
            });
          });
        }).on('close', function() {
          socket.disconnect();
          socket.emit('data', '\r\n*** SSH CONNECTION CLOSED ***\r\n');

        }).on('error', function(err) {
          socket.emit('data', '\r\n*** SSH CONNECTION ERROR: ' + err.message + ' ***\r\n');
        }).connect({
          host: SSHServer,
          username: query['username'],
          password: query['password'],
        });
        socket.on('disconnect',()=>{
          conn.end();
        })
      }catch(err){
        console.log(err.message);
      }
    })();
    
    
  });
}


exports.ioInit = ioInit;