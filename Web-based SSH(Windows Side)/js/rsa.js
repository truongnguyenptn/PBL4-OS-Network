function encryptRSA(message){
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
	    padding: node_crypto.constants.RSA_NO_PADDING,
	    oaepHash: "sha256",
	  },
	  Buffer.from(messageString)
	);
	return encryptedData;
}