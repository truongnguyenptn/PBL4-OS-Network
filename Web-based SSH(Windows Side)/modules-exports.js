var crypto = require('crypto');
var Buffer = require('safe-buffer').Buffer;

console.log(crypto.generateKeyPairSync);

function createPublicKey(str){
	return crypto.createPublicKey(str);
}
function createPrivateKey(str){
	return crypto.createPrivateKey(str);
}
function generateKeyPairSync(type,o){
	return crypto.generateKeyPairSync(type,o);
}

module.exports.node_crypto = crypto;
module.exports.Buffer = Buffer;
module.exports.foo = () => "barr";
module.exports.createPublicKey = crypto.createPublicKey;
module.exports.createPrivateKey = crypto.createPrivateKey;
module.exports.generateKeyPairSync = crypto.generateKeyPairSync;
