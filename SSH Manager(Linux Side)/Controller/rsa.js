const crypto = require('crypto');

function generateRSA(){
	var rsa = crypto.generateKeyPairSync("rsa", {
	  modulusLength: 2048,
	});
	console.log('RSA generated');
	return rsa;
}

function decryptRSA(buffer,privateKey){;
	var decryptedData = crypto.privateDecrypt(
	  {
	    key: privateKey,
	    padding: crypto.constants.RSA_PKCS1_PADDING,
	    oaepHash: "sha256",
	  },
	  buffer
	);
	return decryptedData.toString().replaceAll('\0','');
}
function decryptRSAFromBufferArray(bufferArray,privateKey){
	var returnString = "";
	for(i = 0;i < bufferArray.length;i++){
		var decryptedString = crypto.privateDecrypt(
		  {
		    key: privateKey,
		    padding: crypto.constants.RSA_PKCS1_PADDING,
		    oaepHash: "sha256",
		  },
		  bufferArray[i]
		).toString().replaceAll('\0','');
		returnString += decryptedString;
	}
	return returnString;
}
function encryptRSA(buffer,publicKey){;
	var encryptedData = crypto.publicEncrypt(
	  {
	    key: publicKey,
	    padding: crypto.constants.RSA_PKCS1_PADDING,
	    oaepHash: "sha256",
	  },
	  buffer
	);
	return encryptedData;
}
function encryptRSAToBufferArray(message,publicKey,substring_length=200){
	var messageString = message.toString();
	var bufferArray = [];
    for(let i = 0;i<messageString.length;i+=substring_length){
    	var encryptedData = crypto.publicEncrypt(
		  {
		    key: publicKey,
		    padding: crypto.constants.RSA_PKCS1_PADDING,
		    oaepHash: "sha256",
		  },
		  Buffer.from(messageString.substring(i,i+substring_length))
		);
		bufferArray.push(encryptedData);
    }
    return bufferArray;
}

module.exports = {
	generateRSA,decryptRSA,encryptRSA,decryptRSAFromBufferArray,encryptRSAToBufferArray
}