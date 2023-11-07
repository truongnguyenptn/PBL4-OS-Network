const { IPAddress } = require(".././Database/IPAddress");
const { RSA } = require(".././Database/RSA");
const axios = require('axios');
const crypto = require('crypto');
const https = require('https');

const { SSHServer,NodeJSPort,ServerType } = require('.././getConfig');

const agent = new https.Agent({
  rejectUnauthorized: false
});

function generateRSA(){
	var rsa = crypto.generateKeyPairSync("rsa", {
	  modulusLength: 2048,
	});
	console.log('RSA generated');
	return rsa;
}

async function getRSAFromServer(){
	var publicKey;
	var url = ServerType+'://'+SSHServer+':'+NodeJSPort+'/get-rsa';
	var res = await axios.get(url,{
		httpsAgent:agent,
	}).then(response => {
	  return response;
	}).catch(err => {
	  console.log(err);
	});
	publicKey = res.data.publicKey;
	return publicKey;
}

async function getRSA(ipaddress,update = false){
	var ipa = (await IPAddress.findOrCreate({
		where:{
			ipaddress:ipaddress
		}
	}))[0];

	var { publicKey, privateKey} = generateRSA();

	privateKey = privateKey.export({
	    type: 'pkcs1',
	    format: 'pem'
	});

	publicKey = publicKey.export({
	    type: 'pkcs1',
	    format: 'pem'
	});

	var rsa = (await RSA.findOrCreate({
		where:{
			IPAddressId:ipa.id
		},defaults: {
		    privateKey:privateKey,
		    publicKey:publicKey,
		}
	}))[0];

	if(update){
		await rsa.update({
			privateKey:priKey,
			publicKey:pubKey
		});
		await rsa.save();
	}
	return rsa;
}

async function refreshRSA(){
	//sin
	var rsas = await RSA.findAll();
	console.log('RSA Refreshing');
	for(i = 0;i<rsas.length;i++){
		(async ()=>{
			var { publicKey, privateKey} = generateRSA();
			privateKey = privateKey.export({
			    type: 'pkcs1',
			    format: 'pem'
			});
			publicKey = publicKey.export({
			    type: 'pkcs1',
			    format: 'pem'
			});
			var rsa = rsas[i];
			await rsa.update({
				privateKey:privateKey,
				publicKey:publicKey
			});
			await rsa.save();
			if(i === rsas.length - 1) console.log('RSA Refreshed.');
		})();
	}
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

async function postRSAMessageToServer(url,query,serverRSA){
	var message = {};
	try{
		var publicKey = await getRSAFromServer();

		var JSONString = JSON.stringify({
			query:query,
			publicKey:serverRSA.publicKey.export({
			    type: 'pkcs1',
			    format: 'pem'
			})
		})
		var encryptedData = encryptRSAToBufferArray(JSONString,publicKey);

		var response = await axios.post(url,{
			httpsAgent: new https.Agent({
		    	rejectUnauthorized: false
		  	}),
			data:{
				encrypted:JSON.stringify(encryptedData)
			}
		}).then(response => {
		  return response.data;
		}).catch(err => {
		  console.log(err);
		});

		var responseBufferJSONArray = JSON.parse(response.encrypted);
		var responseBufferArray = [];
		for(i = 0;i < responseBufferJSONArray.length;i++){
			responseBufferArray.push(new Buffer.from(responseBufferJSONArray[i]));
		}

		var decryptedJSON = JSON.parse(decryptRSAFromBufferArray(responseBufferArray,serverRSA.privateKey));
		var message = decryptedJSON;
	}catch(err){
		message = {
			message:'Something wrong happened on Server',
			status:"failed"
		};
		console.log(err);
	}
	return JSON.stringify(message);
}

async function getSessionRSA(query,serverRSA){
	try{
		var url = ServerType+'://'+SSHServer+':'+NodeJSPort+'/get-session-rsa';
		return await JSON.parse(await postRSAMessageToServer(url,query,serverRSA));
	}catch(err){
		console.log(err);
		return {
			status:"failed",
			message:"Server didn't response"
		}
	}	
	
}

// exports.getRSA = getRSA;
// exports.decryptRSA = decryptRSA;
// exports.refreshRSA = refreshRSA;

module.exports = {
	getRSA,generateRSA,getRSAFromServer,decryptRSA,encryptRSA,refreshRSA,decryptRSAFromBufferArray,encryptRSAToBufferArray,postRSAMessageToServer,getSessionRSA
}
