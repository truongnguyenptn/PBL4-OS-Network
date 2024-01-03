const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();
const crypto = require('crypto');
const ejs = require('ejs');

const sessions = require('express-session');


const { changePasswordExpiration,sessionKeyLength,loginExpiration } = require('.././getConfig');

const { User } = require('.././Database/User');
const { Session } = require('.././Database/Session');

const { getActivatedUser,registerUser,changePasswordUsingSession,generateChangePasswordSession } = require('.././Controller/user.js');
const { getSession,getChangePasswordSession,generateRandomString } = require('.././Controller/session');
const { showSession,loginAdmin,checkAdminLogin,logoutAdmin,
getInactivatedUsers,getActiveUsers,getBlockedUsers,
adminUpdateUser,enableUser,disableUser,
adminActivateUser,adminGenerateChangePasswordSession } = require('.././Controller/admin');

const { generateRSA,decryptRSA,encryptRSA,decryptRSAFromBufferArray,encryptRSAToBufferArray } = require('.././Controller/rsa.js');

const serverRSA = generateRSA();

app.set('view engine', 'ejs');

app.use("/static",express.static('static'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessions({
	secret:generateRandomString(sessionKeyLength),
    saveUninitialized:true,
    cookie: { maxAge: loginExpiration },
    resave: false
}));

console.log(serverRSA);

async function processRequest(req,res,callback){
		var responseMessage;
		try{
			var bufferJSONArray = req.body.encrypted;
			var bufferArray = [];
			for(i = 0;i < bufferJSONArray.length;i++){
				bufferArray.push(new Buffer.from(bufferJSONArray[i]));
			}
			var decryptedJSON = JSON.parse(decryptRSAFromBufferArray(bufferArray,serverRSA.privateKey));
			var query = decryptedJSON.query;
			var publicKey = decryptedJSON.publicKey;
			var responseMessage = await callback(req,query);
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
}

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
			console.log("session");
			console.log(session);

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

			console.log(decryptedJSON);

			var session = await getChangePasswordSession(query.sessionKey);


			var innerJSONBufferArray = JSON.parse(query.encrypted);
			var innerBufferArray = [];
			for(i = 0;i < innerJSONBufferArray.length;i++){
				innerBufferArray.push(new Buffer.from(innerJSONBufferArray[i]));
			}
			var responseMessage;
			try{
				var innerDecrypted = JSON.parse(decryptRSAFromBufferArray(innerBufferArray,session.privateKey));
			

			    responseMessage = JSON.stringify(session.sessionPassword === innerDecrypted.query.sessionPassword ? {
			    	status:"succeeded",
			    	message:"Session Key and Password match."
			    }:{
			    	status:"failed",
			    	message:"Session Key or/and Session Password is wrong."
			    });
			}catch(ex){
				console.log(ex);
				responseMessage = {
			    	status:"failed",
			    	message:"Session Key or/and Session Password is wrong."
			    };
			}

			

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

app.get("/admin",function(req, res) {
	try{
		(async () => {
			if(await checkAdminLogin(req)){
				res.sendFile('static/html/adminPage.html', {
			        root: path.join(__dirname, '.././')
			    })
			}else{
				res.send(`<script>
					alert("You're not logged as Admin.");
					window.location.replace("/admin/login");
					</script>`);
			}
		})();
	}catch(e){
		console.log(e);
		res.send("Error Occured");
	}
})
app.post("/admin/getInactivatedUsers",function (req, res) { 
	//remember that express.json() automatically parsed your body
	//usually, you must do that by JSON.parse
	processRequest(req,res,getInactivatedUsers);
});
app.post("/admin/getActiveUsers",function (req, res) { 
	//remember that express.json() automatically parsed your body
	//usually, you must do that by JSON.parse
	processRequest(req,res,getActiveUsers);
});
app.post("/admin/getBlockedUsers",function (req, res) { 
	//remember that express.json() automatically parsed your body
	//usually, you must do that by JSON.parse
	processRequest(req,res,getBlockedUsers);
});
app.get("/admin/login",function (req, res) { 
	//console.log(req.query);
	try{
	    res.sendFile('static/html/loginAdmin.html', {
	       	root: path.join(__dirname, '.././')
	    }) 
	}catch(e){
		console.log(e);
		res.send("Error Occured");
	}
});
app.post("/admin/login",function (req, res) { 
	//remember that express.json() automatically parsed your body
	//usually, you must do that by JSON.parse
	processRequest(req,res,loginAdmin);
});

app.get("/admin/logout",function (req, res) { 
	//console.log(req.query);
	try{
	    logoutAdmin(req);
	    res.send(`<script>
	    					alert("You're logged out");
	    					window.location.replace("/admin/login");
	    					</script>`);
	}catch(e){
		console.log(e);
		res.send(`<script>
					alert("Logout failed");
					window.location.replace("/admin");
					</script>`);
	}
});

app.get("/admin/updateUser",function (req, res) { 
	//console.log(req.query);
	(async ()=>{
		try{
			if(await checkAdminLogin(req)){
				if(!req.query.id) throw new Error('ID cannot be blank');
				var user = await User.findOne({
					where:{
						id:req.query.id
					}
				})
				if(user == null){
					res.send('User not found');
				}else{
					res.render('updateUser.ejs', {
						user:user
					});
				}
			}else{
				res.send(`<script>
					alert("You're not logged as Admin.");
					window.location.replace("/admin/login");
					</script>`);
			}
	    
		}catch(e){
			console.log(e);
			res.send("Error Occured");
		}
	})();
});
app.post("/admin/updateUser",function (req, res) { 
	//remember that express.json() automatically parsed your body
	//usually, you must do that by JSON.parse
	processRequest(req,res,adminUpdateUser);
});
app.post("/admin/enableUser",function (req, res) { 
	//remember that express.json() automatically parsed your body
	//usually, you must do that by JSON.parse
	processRequest(req,res,enableUser);
});
app.post("/admin/disableUser",function (req, res) { 
	//remember that express.json() automatically parsed your body
	//usually, you must do that by JSON.parse
	processRequest(req,res,disableUser);
});
app.post("/admin/activateUser",function (req, res) { 
	//remember that express.json() automatically parsed your body
	//usually, you must do that by JSON.parse
	processRequest(req,res,adminActivateUser);
});
app.post("/admin/generateChangePasswordSession",function (req, res) { 
	//remember that express.json() automatically parsed your body
	//usually, you must do that by JSON.parse
	processRequest(req,res,adminGenerateChangePasswordSession);
});
module.exports = {app};