const crypto = require("crypto");

console.log(crypto.generateKeyPairSync);

var { publicKey:pubKey, privateKey:priKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
});

var priKeyString = priKey.export({
    type: 'pkcs1',
    format: 'pem'
});

var pubKeyString = pubKey.export({
    type: 'pkcs1',
    format: 'pem'
});

var pubKey2 = crypto.createPublicKey(pubKeyString);
var priKey2 = crypto.createPrivateKey(priKeyString);

const data = "shhhhh!";

var encryptedData = crypto.publicEncrypt(
  {
    key: pubKeyString,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: "sha256",
  },
  Buffer.from(data)
);

console.log("encypted data: ", encryptedData.toString("base64"));

var decryptedData = crypto.privateDecrypt(
  {
    key: priKeyString,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: "sha256",
  },
  encryptedData
);
console.log("decrypted data: ", decryptedData.toString());

encryptedData = crypto.publicEncrypt(
  {
    key: pubKey2,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: "sha256",
  },
  Buffer.from(data)
);

console.log("encypted data: ", encryptedData);

decryptedData = crypto.privateDecrypt(
  {
    key: priKey2,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: "sha256",
  },
  encryptedData
);
console.log("decrypted data: ", decryptedData.toString());
