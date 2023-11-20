async function sendFile(socket,file,bufferSize=65536,validationStep=128){
	socket.emit('file-upload',{
          destinationFolder:txtDestination.value,
          filename: file.name,
          status:'create_buffer'
      });

      await sleep(100);
      var previousTimestamp = new Date().valueOf();

      var totalBytesPerStep = bufferSize * validationStep;
      console.log(totalBytesPerStep);
      for(let i = 0 ; i <= file.size; i += bufferSize){
        await sleep(10);

        if(socket.connected){
            socket.emit('file-upload',{
	            start:i,
	            destinationFolder:destinationFolder,
	            filename: file.name,
	            buffer:file.slice(i,i+bufferSize)
	        });
          // if((i / bufferSize) % validationStep == validationStep - 1){
            
          //   var currentTimestamp = new Date().valueOf();
            
          //   var deltaTimestamp = currentTimestamp - previousTimestamp;
          //   var bytesPerSecond = totalBytesPerStep * 1000 / deltaTimestamp;
          //  	previousTimestamp = currentTimestamp;
          // }
        }else{
          alert('File upload failed');
          break;
        }
      }
      await sleep(100);
      socket.emit('file-upload',{
          destinationFolder:txtDestination.value,
          filename: file.name,
          status:'complete'
      });
}