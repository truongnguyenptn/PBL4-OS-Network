function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

window.addEventListener('load', function() {
  var fileBuffers = {};
  var step = 0;
  const bufferSize = 65536;//8192
  const validationStep = 128;
  var loginModal = document.getElementById('login-modal');
  loginModal.style.display = "block";
  var login_button = document.getElementById('login-button');
  var txtUsername = document.getElementById('username');
  var txtPassword = document.getElementById('password');

  const btnUploadModal = document.getElementById('btnUploadModal');
  const btnUploadModalClose = document.getElementById('btnUploadModalClose');
  const uploadModal = document.getElementById('upload-modal');
  const fileUpload = document.getElementById('fileUpload');
  const btnUpload = document.getElementById('btnUpload');
  const txtDestination = document.getElementById('txtDestination');

  const btnDownloadModal = document.getElementById('btnDownloadModal');
  const btnDownloadModalClose = document.getElementById('btnDownloadModalClose');
  const downloadModal = document.getElementById('download-modal');
  const btnDownload = document.getElementById('btnDownload');
  const txtDownloadPath = document.getElementById('txtDownloadPath');
  const txtDownloadFilename = document.getElementById('txtDownloadFilename');

  const progressModal = document.getElementById('progress-modal');
  const progressBar = document.getElementById('progressBar');
  const progressLabel1 = document.getElementById('progressLabel1');
  const progressLabel2 = document.getElementById('progressLabel2');

  var terminalContainer = document.getElementById('terminal-container');
  var term;
  term = new Terminal({ cursorBlink: true });
  term.open(terminalContainer);
  
  var socket;


  // Browser -> Backend
  term.onData(function(data) {
    socket.emit('data', data);
  });
  login_button.onclick = () => {

    // socket = io.connect({
    // "query": {
    //     "username": txtUsername.value,
    //     "password": txtPassword.value
    // }
    // });
    (async () => {

        var encryptedData = await encryptRSAToBufferArray(JSON.stringify({
              "username": txtUsername.value,
              "password": txtPassword.value
          }));
        socket = io.connect({
          "query":{encrypted:JSON.stringify(encryptedData)}
        });

        socket.on('connect', function() {
          console.log(socket);
          term.write('\r\n*** Connected to backend***\r\n');
          // Backend -> Browser
          socket.on('data', function(data) {
            term.write(data);
          });

          socket.on('disconnect', function() {
            term.write('\r\n*** Disconnected from backend***\r\n');
            loginModal.style.display = 'block';
            uploadModal.style.display = 'none';
            downloadModal.style.display = 'none';
            progressModal.style.display = 'none';
            socket.destroy();
          });
        });
        loginModal.style.display = 'none';
        window.onbeforeunload = () => {
            socket.close();
        };

    })();
    } 

    btnUploadModal.onclick = () => {
      uploadModal.style.display = 'block';
    };

    btnUploadModalClose.onclick = () => {
      uploadModal.style.display = 'none';
    };

    btnUpload.onclick = async (event) => {
      var destinationFolder = txtDestination.value;
      var file = fileUpload.files[0];

      progressModal.style.display = 'block';
      progressLabel1.innerHTML = `Filename:${file.name} Size:${file.size}`;
      progressBar.max = file.size;
      progressBar.value = 0;

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
          progressBar.value = i;
          if((i / bufferSize) % validationStep == validationStep - 1){
            
            var currentTimestamp = new Date().valueOf();
            
            var deltaTimestamp = currentTimestamp - previousTimestamp;
            var bytesPerSecond = totalBytesPerStep * 1000 / deltaTimestamp;
            progressLabel2.innerHTML = formatBytes(Math.floor(bytesPerSecond)) + "/s";
            previousTimestamp = currentTimestamp;
          }
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

      progressModal.style.display = 'none';

      
      uploadModal.style.display = 'none';
    };

    btnDownloadModal.onclick = () => {
      downloadModal.style.display = 'block';
    };

    btnDownloadModalClose.onclick = () => {
      downloadModal.style.display = 'none';
    };

    var previousTimestamp = new Date().valueOf();

    btnDownload.onclick = async (event) => {
      var downloadPath = txtDownloadPath.value;
      var downloadFilename = txtDownloadFilename.value;
      if(downloadFilename.length > 0){
        socket.emit('file-download',{
          path:downloadPath,
          filename:downloadFilename,
        })
      }else{
        alert('Filename cannot be blank.');
      }
      socket.on('file-download',(res)=>{

        if(res.status === "create_buffer"){
          fileBuffers[res.filename] = [];
          progressModal.style.display = 'block';
          progressLabel1.innerHTML = `Filename:${res.filename} Size:${res.size}`;
          progressBar.max = res.size;
          progressBar.value = 0;
          
          
        } 


        if(res.buffer!==undefined){
          if(fileBuffers[res.filename] === undefined) fileBuffers[res.filename] = [];
          fileBuffers[res.filename].push(res.buffer);
          //console.log(res.buffer.byteLength);
          progressBar.value += res.buffer.byteLength;
          if(step % validationStep == validationStep - 1){
            console.log(step)
            var currentTimestamp = new Date().valueOf();
            var deltaTimestamp = currentTimestamp - previousTimestamp;
            console.log(deltaTimestamp);
            var bytesPerSecond = (validationStep*res.buffer.byteLength) * 1000 / deltaTimestamp;
            progressLabel2.innerHTML = formatBytes(Math.floor(bytesPerSecond)) + "/s";
            previousTimestamp = currentTimestamp;
            step = 0;
          }
          step = step + 1;
          console.log(step);
        }

        if(res.status === "complete"){
          console.log(fileBuffers[res.filename]);
          var link = document.createElement('a');
          link.href = window.URL.createObjectURL(new Blob(fileBuffers[res.filename]));
          link.download = res.filename;
          link.click();
          fileBuffers[res.filename] = undefined;
          progressModal.style.display = 'none';
          uploadModal.style.display = 'none';
        }
      })
      
    };

    const btnCustomizeModal = document.getElementById('btnCustomizeModal');
    const customizeModal = document.getElementById('customize-modal');
    const btnCustomizeModalClose = document.getElementById('btnCustomizeModalClose');
    const txtTermBackgroundImage = document.getElementById('txtTermBackgroundImage');
    const txtTermBackgroundColor = document.getElementById('txtTermBackgroundColor');
    const txtTermBonus = document.getElementById('txtTermBonus');
    const btnCustomize = document.getElementById('btnCustomize');
    btnCustomizeModal.onclick = () => {
      customizeModal.style.display = 'block';
    }
    btnCustomizeModalClose.onclick = () => {
      customizeModal.style.display = 'none';
    }
    btnCustomize.onclick = () => {
      var collection = document.getElementsByClassName("xterm-viewport");
      for(let i = 0;i<collection.length;i++){
        var current = collection[i];
        current.style.backgroundColor = txtTermBackgroundColor.value;
        current.style.background = `url('${txtTermBackgroundImage.value}') no-repeat center center`;
        current.style.backgroundSize = 'contain';
        // current.style.backgroundRepeat = 'no-repeat';
      }
      customizeModal.style.display = 'none';
    }
}, false);