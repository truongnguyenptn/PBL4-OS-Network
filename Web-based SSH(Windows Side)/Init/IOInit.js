

var SSHClient = require('ssh2').Client;
const { getRSA,decryptRSA,decryptRSAFromBufferArray } = require('.././Controller/rsa.js');

const { SSHServer } = require('.././getConfig.js');
const defaultChunkSize = 65536;
function ioInit(server){
  var io = require('socket.io')(server);

  io.on('connection', function(socket) {
    
    
    (async () =>{
      try{
        const ip = socket.handshake.address;
        const rsa = await getRSA(ip);

        var uploadBuffers = {};

        var encryptedBufferJSONString = socket.handshake.query.encrypted;
        var encryptedBufferJSONArray = JSON.parse(encryptedBufferJSONString);
        var bufferArray = [];
        for(i = 0;i<encryptedBufferJSONArray.length;i++){
          bufferArray.push(new Buffer.from(encryptedBufferJSONArray[i]));
        }
        var decryptedString = decryptRSAFromBufferArray(bufferArray,rsa.privateKey);
        var query = JSON.parse(decryptedString);

        var username = query.username;
        var password = query.password;

        var executeString = "";

        //console.log(query);
        var conn = new SSHClient();
        conn.on('ready', function() {
          socket.emit('data', '\r\n*** SSH CONNECTION ESTABLISHED ***\r\n');
          conn.shell(function(err, stream) {
            if (err)
              return socket.emit('data', '\r\n*** SSH SHELL ERROR: ' + err.message + ' ***\r\n');
            socket.on('data', function(data) {
              //console.log(data);
              // switch(data.charCodeAt(0)) {
              //   case 13:
              //     executeString += data;
              //     console.log(executeString);
              //     stream.write(data);
              //     executeString = "";
              //   break;
              //   default:
              //     executeString += data;
              //     stream.write(data);
              //   break;
              // }
              stream.write(data);
            });
            stream.on('data', function(d) {
              socket.emit('data', d.toString('binary'));
            }).on('close', function() {
              conn.end();
            });

          });

          conn.sftp((sftpErr, sftp) => {
            if (sftpErr) console.log(sftpErr);

            // sftp.readdir("/home/"+username, (err, list) => {
            //   if (err) throw err;
            //   console.dir(list);
            // });

            socket.on('get-directories-list',(res)=>{
                sftp.readdir(res.path, (err, list) => {
                  if (err){
                    socket.emit('get-directories-list',{
                      err:err
                    })
                  } else{
                    socket.emit('get-directories-list',{
                    list:list,
                    path:res.path
                  });
                  }
                  
                });
            });
            socket.on('edit',(res)=>{
              try{
                sftp.rename(res.oldPath,res.newPath);
                sftp.chmod(res.newPath,res.chmod);
                socket.emit('data', `\r\n${res.oldPath} has been renamed to ${res.newPath} and its permission changed to ${res.chmod}.\r\n`);
              }catch(err){
                console.log(err);
              } 
            });

            socket.on('delete',(res)=>{
              try{
                
                //socket.emit('data', `\r\n${res.oldPath} has been deleted successfully.\r\n`);
              }catch(err){
                console.log(err);
              } 
            });

            socket.on('file-upload', (res) => {
              (async() => {
                try{
                  if(res.status === 'create_buffer') uploadBuffers[`${res.destinationFolder}/${res.filename}`] = [];
                  if(res.buffer !== undefined) uploadBuffers[`${res.destinationFolder}/${res.filename}`].push(res.buffer);
                  if(res.status === 'complete'){
                      uploadBuffers[`${res.destinationFolder}/${res.filename}`] = Buffer.concat(uploadBuffers[`${res.destinationFolder}/${res.filename}`]);
                      console.log(uploadBuffers);
                      sftp.mkdir(`${res.destinationFolder}`,()=>{});
                      console.log('create stream');
                      var writeStream = await sftp.createWriteStream(`${res.destinationFolder}/${res.filename}`,{
                        start:res.start,
                        flags: 'w', // w - write and a - append
                        encoding: null, // use null for binary files
                        mode: 0o666, // mode to use for created file (rwx)
                      });
                      console.log('write to stream');
                      await writeStream.write(uploadBuffers[`${res.destinationFolder}/${res.filename}`],()=>{});
                      uploadBuffers[`${res.destinationFolder}/${res.filename}`] = undefined;
                      socket.emit('data', `\r\nFile ${res.destinationFolder}/${res.filename} has been successfully uploaded.\r\n`);
                  }            
                }catch(sub_err2){
                  console.log(sub_err2);
                }
              })();
              
            });
            socket.on('file-download', (res) => {
              try{
                var path = res.path
                var filename = res.filename;
                sftp.open(path + "/" + filename,"r",(err,handle)=>{
                  try{
                    if(handle === undefined) throw new Error(`File ${path + "/" + filename} not found.`);
                    // var readStream = sftp.createReadStream(path + "/" + filename);
                    // var buffer = Buffer.alloc(chunkSize);
                    // var bytesRead = 0;
                    // readStream.read(handle,buffer, bytesRead, chunkSize, bytesRead,(err, bytesRead, buf, pos)=>{
                    //   if(err) {
                    //       throw new Error("Error retrieving the file.");
                    //       errorOccured = true;
                    //   }
                    //   totalBytesRead += bytesRead;
                    //   console.log(buf);
                    //   if(totalBytesRead === bufferSize) {
                          
                          
                    //   }
                    // });
                    //console.log(buffer);

                    sftp.fstat(handle, function(err, stats) {
                        var bufferSize = stats.size,
                            buffer = Buffer.alloc(bufferSize),
                            chunkSize = defaultChunkSize,
                            bytesRead = 0,
                            errorOccured = false;

                        console.log(bufferSize);

                        socket.emit('file-download',{
                          filename:res.filename,
                          size:bufferSize,
                          status:'create_buffer'
                        });


                        while (bytesRead < bufferSize && !errorOccured) {
                            if ((bytesRead + chunkSize) > bufferSize) {
                                chunkSize = (bufferSize - bytesRead);
                            }
                            sftp.read(handle, buffer, bytesRead, chunkSize, bytesRead, callbackFunc);
                            bytesRead += chunkSize;
                        }

                        var totalBytesRead = 0;
                        function callbackFunc(err, bytesRead, buf, pos) {
                            if(err) {
                                console.log(err);
                                throw "Error retrieving the file.";
                                errorOccured = true;
                            }
                            totalBytesRead += bytesRead;
                            //console.log(buf);
                            socket.emit('file-download',{
                              filename:res.filename,
                              buffer:buf
                            })
                            if(totalBytesRead === bufferSize) {
                              socket.emit('file-download',{
                                filename:res.filename,
                                status:"complete"
                              });
                            }
                        }
                        
                    });
                    
                  }
                  catch(err){
                    console.log(err);
                    socket.emit('data', `\r\nFile ${path + "/" + filename} not found.\r\n`);
                    // socket.emit('file-upload',{
                    //   status:'failed',
                    //   message:`File ${path + "/" + filename} not found.`
                    // })
                  }
                });
              }catch(err){
                console.log(err);
              }
            });
          });

        }).on('close', function() {
          socket.disconnect();
          console.log("Connection closed");
          socket.emit('data', '\r\n*** SSH CONNECTION CLOSED ***\r\n');

        }).on('error', function(err) {
          console.log(err);
          socket.emit('data', '\r\n*** SSH CONNECTION ERROR: ' + err.message + ' ***\r\n');
        }).connect({
          host: SSHServer,
          username: username,
          password: password,
        });

        socket.on('disconnect',()=>{
          conn.end();
        });
        


      }catch(err){
        console.log(err.message);
      }
    })();
    
    
  });
}




exports.ioInit = ioInit;