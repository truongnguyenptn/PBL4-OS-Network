var fs = require('fs');
var path = require('path');
var express = require('express');
var app = express();
var crypto = require('crypto'); 

const { SSHServer,NodeJSPort,ServerType } = require('.././getConfig');

const {registerUser} = require('.././Controller/user.js');

const { getRSA,generateRSA,decryptRSA,encryptRSA,decryptRSAFromBufferArray,encryptRSAToBufferArray,getSessionRSA,postRSAMessageToServer } = require('.././Controller/rsa.js');

const serverRSA = generateRSA();

app.use("/css/xterm.css",express.static('node_modules/xterm/css/xterm.css'));
app.use("/lib/xterm.js",express.static('node_modules/xterm/lib/xterm.js'));
app.use("/lib/xterm-addon-fit.js",express.static('node_modules/xterm-addon-fit/lib/xterm-addon-fit.js'));
app.use("/static",express.static('static'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get("/",function (req, res) { 
	//console.log(req.query);
	try{
	    res.sendFile('static/html/index.html', {
	        root: path.join(__dirname, '.././')
	    }) 
	}catch(e){
		console.log(e);
		res.send("Error Occured");
	}
});

app.get("/register",function (req, res) { 
	//console.log(req.query);
	try{
	    res.sendFile('static/html/registration-form.html', {
	        root: path.join(__dirname, '.././')
	    }) 
	}catch(e){
		console.log(e);
		res.send("Error Occured");
	}
});
app.post("/register",function (req, res) { 
	//remember that express.json() automatically parsed your body
	//usually, you must do that by JSON.parse
	(async () =>{
		var responseMessage;
		try{
			var id = req.ip;
			var rsa = await getRSA(id);
			var bufferJSONArray = req.body.encrypted;
			var bufferArray = [];
			for(i = 0;i < bufferJSONArray.length;i++){
				bufferArray.push(new Buffer.from(bufferJSONArray[i]));
			}

			var decryptedJSON = JSON.parse(decryptRSAFromBufferArray(bufferArray,rsa.privateKey));
			var query = decryptedJSON.query;
			var publicKey = decryptedJSON.publicKey;

			var responseMessage = await registerUser(query,serverRSA);
			//console.log(responseMessage);

			var encryptedData = encryptRSAToBufferArray(responseMessage,publicKey);
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.write(JSON.stringify({ encrypted:encryptedData })); 
			res.end();
		}catch(err){
			console.log(err);
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.write(JSON.stringify({ message:'Error Occured.' , error : true})); 
			res.end();
		}
	})();
	 
});

app.get("/get-rsa",function (req, res) { 
	(async () => {
		var id = req.ip;
		var rsa = await getRSA(id);
		try{
		    res.writeHead(200, {'Content-Type': 'application/json'});
			res.write(JSON.stringify({ publicKey: rsa.publicKey })); 
			res.end();

		}catch(e){
			res.send("Error Occured");
		}
	})();
});

app.get("/forget-password",function (req, res) { 
	//console.log(req.query);
	try{
	    res.sendFile('static/html/forget-password.html', {
	        root: path.join(__dirname, '.././')
	    }) 
	}catch(e){
		console.log(e);
		res.send("Error Occured");
	}
});

app.post("/get-session-rsa",function(req,res){
	(async () => {
		var responseMessage;
		try{
			var id = req.ip;
			var rsa = await getRSA(id);
			var bufferJSONArray = req.body.encrypted;
			var bufferArray = [];
			for(i = 0;i < bufferJSONArray.length;i++){
				bufferArray.push(new Buffer.from(bufferJSONArray[i]));
			}

			var decryptedJSON = JSON.parse(decryptRSAFromBufferArray(bufferArray,rsa.privateKey));
			var query = decryptedJSON.query;
			var publicKey = decryptedJSON.publicKey;
			try{
				var responseMessage = JSON.stringify(await getSessionRSA({
					sessionKey: query.sessionKey
				},serverRSA));
			}catch(err){
				var responseMessage = JSON.stringify({
					status:"failed",
					message:"Server didn't respond."
				})
				console.log(err);
			}
			console.log(responseMessage);
			

			var encryptedData = encryptRSAToBufferArray(responseMessage,publicKey);
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.write(JSON.stringify({ encrypted:encryptedData })); 
			res.end();
		}catch(err){
			console.log(err);
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.write(JSON.stringify({ message:'Error Occured.' , error : true})); 
			res.end();
		}
	})();
})

app.post("/check-change-password-session",function(req,res){
	(async () => {
		var responseMessage;
		try{
			var id = req.ip;
			var rsa = await getRSA(id);
			var bufferJSONArray = req.body.encrypted;
			var bufferArray = [];
			for(i = 0;i < bufferJSONArray.length;i++){
				bufferArray.push(new Buffer.from(bufferJSONArray[i]));
			}

			var decryptedJSON = JSON.parse(decryptRSAFromBufferArray(bufferArray,rsa.privateKey));
			var query = decryptedJSON.query;
			var publicKey = decryptedJSON.publicKey;

			var url = ServerType+'://'+SSHServer+':'+NodeJSPort+'/check-change-password-session';
			try{
				var responseMessage = JSON.stringify(await postRSAMessageToServer(url,
				decryptedJSON.query,serverRSA));
			}catch(err){
				var responseMessage = JSON.stringify({
					status:"failed",
					message:"Server didn't respond."
				})
				console.log(err);
			}
			var encryptedData = encryptRSAToBufferArray(responseMessage,publicKey);
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.write(JSON.stringify({ encrypted:encryptedData })); 
			res.end();
		}catch(err){
			console.log(err);
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.write(JSON.stringify({ message:'Error Occured.' , error : true})); 
			res.end();
		}
	})();
})

app.post("/generate-change-password-session",function(req,res){
	(async () => {
		var responseMessage;
		try{
			var id = req.ip;
			var rsa = await getRSA(id);
			var bufferJSONArray = req.body.encrypted;
			var bufferArray = [];
			for(i = 0;i < bufferJSONArray.length;i++){
				bufferArray.push(new Buffer.from(bufferJSONArray[i]));
			}

			var decryptedJSON = JSON.parse(decryptRSAFromBufferArray(bufferArray,rsa.privateKey));
			var query = decryptedJSON.query;
			var publicKey = decryptedJSON.publicKey;

			console.log(query);
			var url = ServerType+'://'+SSHServer+':'+NodeJSPort+'/generate-change-password-session';
			try{
				var responseMessage = JSON.stringify(await postRSAMessageToServer(url,
				decryptedJSON.query,serverRSA));
			}catch(err){
				var responseMessage = JSON.stringify({
					status:"failed",
					message:"Server didn't respond."
				})
				console.log(err);
			}
			var encryptedData = encryptRSAToBufferArray(responseMessage,publicKey);
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.write(JSON.stringify({ encrypted:encryptedData })); 
			res.end();
		}catch(err){
			console.log(err);
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.write(JSON.stringify({ message:'Error Occured.' , error : true})); 
			res.end();
		}
	})();
})

app.post("/change-password",function(req,res){
	(async () => {
		var responseMessage;
		try{
			var id = req.ip;
			var rsa = await getRSA(id);
			var bufferJSONArray = req.body.encrypted;
			var bufferArray = [];
			for(i = 0;i < bufferJSONArray.length;i++){
				bufferArray.push(new Buffer.from(bufferJSONArray[i]));
			}

			var decryptedJSON = JSON.parse(decryptRSAFromBufferArray(bufferArray,rsa.privateKey));
			var query = decryptedJSON.query;
			var publicKey = decryptedJSON.publicKey;
			var url = ServerType+'://'+SSHServer+':'+NodeJSPort+'/change-password';
			try{
				var responseMessage = JSON.stringify(await postRSAMessageToServer(url,
				decryptedJSON.query,serverRSA));
			}catch(err){
				var responseMessage = JSON.stringify({
					status:"failed",
					message:"Server didn't respond."
				})
				console.log(err);
			}
			var encryptedData = encryptRSAToBufferArray(responseMessage,publicKey);
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.write(JSON.stringify({ encrypted:encryptedData })); 
			res.end();
		}catch(err){
			console.log(err);
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.write(JSON.stringify({ message:'Error Occured.' , error : true})); 
			res.end();
		}
	})();
})

app.get("/crypto",function (req, res) { 
	//console.log(req.query);
	try{
	    res.sendFile('static/html/crypto.html', {
	        root: path.join(__dirname, '.././')
	    }) 
	}catch(e){
		res.send("Error Occured");
	}
});
app.post("/crypto",function (req, res) { 
	//console.log(req.query);

	try{
	   	(async () => {
	   		try{

				var id = req.ip;
				var rsa = await getRSA(id);

				var buffer = new Buffer.from(req.body.encrypted);
				var decryptedJSON = JSON.parse(decryptRSA(buffer,rsa.privateKey));

				var responseBuffer = new Buffer.from(JSON.stringify({
					"message":decryptedJSON.message,
				}));

				var publicKey = crypto.createPublicKey(decryptedJSON.publicKey);
				var encryptedData = encryptRSA(responseBuffer,publicKey);
				res.send(JSON.stringify({encrypted:encryptedData}));
				res.end();
			}catch(e){
				console.log(e.message);
			}
		})();
	}catch(e){
		res.send("Error Occured");
	}
});

exports.app = app;