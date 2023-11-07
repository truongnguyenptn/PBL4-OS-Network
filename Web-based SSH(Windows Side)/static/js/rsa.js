try{
	var node_crypto = require('crypto');
	var Buffer = require('safer-buffer').Buffer;
	var nodeRSA = require('node-rsa');
}catch{
	var { node_crypto,Buffer,nodeRSA } = window.modulesExports;
}

function generateRSA(){
	return new nodeRSA({b:2048});
}


async function encryptRSA(message){
	var messageString = message.toString();
	publicKeyString = await fetch('get-rsa', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then((res) => res.json())
    .then((resJson) => resJson.publicKey);
    var encryptedData = node_crypto.publicEncrypt(
	  {
	    key: publicKeyString,
	    padding: node_crypto.constants.RSA_PKCS1_PADDING,
	    oaepHash: "sha256",
	  },
	  Buffer.from(messageString)
	);
	return encryptedData;
}

function decryptRSA(buffer,privateKey){
	var decryptedData = node_crypto.privateDecrypt(
	  {
	    key: privateKey,
	    padding: node_crypto.constants.RSA_PKCS1_PADDING,
	    oaepHash: "sha256",
	  },
	  buffer
	);
	return decryptedData.toString();
}

async function encryptRSAToBufferArray(message,publicKey=undefined,substring_length=200){
	var messageString = message.toString();
	var bufferArray = [];
	console.log('Fetching Key');

	publicKeyString = publicKey ? publicKey : await fetch('get-rsa', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then((res) => res.json())
    .then((resJson) => resJson.publicKey);
    for(let i = 0;i<messageString.length;i+=substring_length){
    	var encryptedData = node_crypto.publicEncrypt(
		  {
		    key: publicKeyString,
		    padding: node_crypto.constants.RSA_PKCS1_PADDING,
		    oaepHash: "sha256",
		  },
		  Buffer.from(messageString.substring(i,i+substring_length))
		);
		bufferArray.push(encryptedData);
    }
    return bufferArray;
}


function decryptRSAFromBufferArray(bufferArray,privateKey){
	var returnString = "";
	for(i = 0;i < bufferArray.length;i++){
		var decryptedString = node_crypto.privateDecrypt(
		  {
		    key: privateKey,
		    padding: node_crypto.constants.RSA_PKCS1_PADDING,
		    oaepHash: "sha256",
		  },
		  bufferArray[i]
		).toString().replaceAll('\0','');
		returnString += decryptedString;
	}
	return returnString;
}