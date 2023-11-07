var fs = require('fs');
var path = require('path');
var express = require('express');
var app = express();
var crypto = require('crypto');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { User } = require('.././Database/User');
const { Session } = require('.././Database/Session');

const { getActivatedUser,registerUser,changePasswordUsingSession,generateChangePasswordSession } = require('.././Controller/user.js');
const { getSession,getChangePasswordSession } = require('.././Controller/session');

const { generateRSA,decryptRSA,encryptRSA,decryptRSAFromBufferArray,encryptRSAToBufferArray } = require('.././Controller/rsa.js');

const serverRSA = generateRSA();

console.log(serverRSA);

app.get("/get-rsa",function (req, res) { 
	try{
		var publicKeyString = serverRSA.publicKey.export({
			    type: 'pkcs1',
			    format: 'pem'
			});
	    res.writeHead(200, {'Content-Type': 'application/json'});
		res.write(JSON.stringify({ 
			publicKey:publicKeyString
		})); 
		res.end();
	}catch(e){
		console.log(e.message);
	}
});

app.post("/get-session-rsa",function (req,res){
	(async () => {
		try{
			var bufferJSONArray = JSON.parse(req.body.data.encrypted);
			var bufferArray = [];
			for(i = 0;i < bufferJSONArray.length;i++){
				bufferArray.push(new Buffer.from(bufferJSONArray[i]));
			}
			var decryptedJSON = JSON.parse(decryptRSAFromBufferArray(bufferArray,serverRSA.privateKey));
			
			var query = decryptedJSON.query;
			var publicKey = decryptedJSON.publicKey;

			var session = await getSession(query.sessionKey);

		    var responseMessage = JSON.stringify(session ? {
		    	status:'succeeded',
		    	publicKey:session.publicKey
		    } : {
		    	status:"failed",
		    	message:"Session Key or/and Session Password is wrong."
		    });

			var encryptedData = encryptRSAToBufferArray(responseMessage,publicKey);
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.write(JSON.stringify({ encrypted:JSON.stringify(encryptedData) })); 
			res.end();
		}catch(e){
			console.log(e);
		}
	})();
});

app.post("/check-change-password-session",function (req,res){
	(async () => {
		try{
			var bufferJSONArray = JSON.parse(req.body.data.encrypted);
			var bufferArray = [];
			for(i = 0;i < bufferJSONArray.length;i++){
				bufferArray.push(new Buffer.from(bufferJSONArray[i]));
			}
			var decryptedJSON = JSON.parse(decryptRSAFromBufferArray(bufferArray,serverRSA.privateKey));
			
			var query = decryptedJSON.query;
			var publicKey = decryptedJSON.publicKey;

			var session = await getChangePasswordSession(query.sessionKey);

			var innerJSONBufferArray = JSON.parse(query.encrypted);
			var innerBufferArray = [];
			for(i = 0;i < innerJSONBufferArray.length;i++){
				innerBufferArray.push(new Buffer.from(innerJSONBufferArray[i]));
			}

			var innerDecrypted = JSON.parse(decryptRSAFromBufferArray(innerBufferArray,session.privateKey));
			

		    var responseMessage = JSON.stringify(session.sessionPassword === innerDecrypted.query.sessionPassword ? {
		    	status:"succeeded",
		    	message:"Session Key and Password match."
		    }:{
		    	status:"failed",
		    	message:"Session Key or/and Session Password is wrong."
		    });

		    console.log(responseMessage);

			var encryptedData = encryptRSAToBufferArray(responseMessage,publicKey);
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.write(JSON.stringify({ encrypted:JSON.stringify(encryptedData) })); 
			res.end();
		}catch(e){
			console.log(e);
		}
	})();
});

app.post("/generate-change-password-session",function (req,res){
	(async () => {
		try{
			var bufferJSONArray = JSON.parse(req.body.data.encrypted);
			var bufferArray = [];
			for(i = 0;i < bufferJSONArray.length;i++){
				bufferArray.push(new Buffer.from(bufferJSONArray[i]));
			}
			var decryptedJSON = JSON.parse(decryptRSAFromBufferArray(bufferArray,serverRSA.privateKey));
			
			var query = decryptedJSON.query;
			var publicKey = decryptedJSON.publicKey;

			try{
				var user = await getActivatedUser(query);
				if(user ==  null) throw new Error('User is not registered/activated.');
				var responseMessage = JSON.stringify(await generateChangePasswordSession(user));
			}catch(err){
				console.log(err);
				var responseMessage = JSON.stringify({
					status:'failed',
					message:'Session is failed to be generated.'
				});
			}

			var encryptedData = encryptRSAToBufferArray(responseMessage,publicKey);
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.write(JSON.stringify({ encrypted:JSON.stringify(encryptedData) })); 
			res.end();
		}catch(e){
			console.log(e);
		}
	})();
});

app.post("/change-password",function (req,res){
	(async () => {
		try{
			var bufferJSONArray = JSON.parse(req.body.data.encrypted);
			var bufferArray = [];
			for(i = 0;i < bufferJSONArray.length;i++){
				bufferArray.push(new Buffer.from(bufferJSONArray[i]));
			}
			var decryptedJSON = JSON.parse(decryptRSAFromBufferArray(bufferArray,serverRSA.privateKey));
			
			var query = decryptedJSON.query;
			var publicKey = decryptedJSON.publicKey;
			console.log(query);

			var responseMessage = JSON.stringify(await changePasswordUsingSession(query));

			var encryptedData = encryptRSAToBufferArray(responseMessage,publicKey);
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.write(JSON.stringify({ encrypted:JSON.stringify(encryptedData) })); 
			res.end();
		}catch(e){
			console.log(e);
		}
	})();
});

app.post("/register",function (req, res) { 
	//remember that express.json() automatically parsed your body
	//usually, you must do that by JSON.parse
	(async () =>{
		var responseMessage;
		try{
			var bufferJSONArray = JSON.parse(req.body.data.encrypted);
			var bufferArray = [];
			for(i = 0;i < bufferJSONArray.length;i++){
				bufferArray.push(new Buffer.from(bufferJSONArray[i]));
			}
			var decryptedJSON = JSON.parse(decryptRSAFromBufferArray(bufferArray,serverRSA.privateKey));
			var query = decryptedJSON.query;
			var publicKey = decryptedJSON.publicKey;
			var responseMessage = await registerUser(query);
			var encryptedData = encryptRSAToBufferArray(responseMessage,publicKey);
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.write(JSON.stringify({ encrypted:JSON.stringify(encryptedData) })); 
			res.end();
		}catch(err){
			console.log(err);
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.write(JSON.stringify({ message:'Error Occured.' , error : true})); 
			res.end();
		}
	})();
	 
});

module.exports = {app};