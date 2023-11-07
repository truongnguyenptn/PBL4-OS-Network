const { Op } = require("sequelize");
var {User} = require('.././Database/User');
var {usernameRegex,emailRegex,nameRegex,descriptionRegex} = require('./regex');
const axios = require('axios');
const https = require('https');
const agent = new https.Agent({
  rejectUnauthorized: false
});

const { SSHServer,NodeJSPort,ServerType } = require('.././getConfig');

const { getRSAFromServer,encryptRSAToBufferArray,decryptRSAFromBufferArray,postRSAMessageToServer,getSessionRSA } = require('./rsa');



async function registerUser(query,serverRSA){

	var message = {};
	try{
		try{
			//for backup
			var check_user = await User.findOne({ 
				where: { 
					[Op.or]:[
						{
							username:query.username
						},
						{
							email:query.email
						}
					]
				} 
			});
			if(check_user !== null) throw new Error("Username or Email exists");
			var new_user = await User.create({
				firstname:query.firstname,
				lastname:query.lastname,
				username:query.username,
				email:query.email,
				description:query.description
			});
		}catch(e2){

		}

		var url = ServerType+'://'+SSHServer+':'+NodeJSPort+'/register';

		var message = JSON.parse(await postRSAMessageToServer(url,query,serverRSA));
	}catch(err){
		message = {
			message:err.message,
			status:"failed"
		};
		console.log(err);
	}
	return JSON.stringify(message);
}



async function changePasswordBySession(sessionKey,sessionPassword,password,serverRSA){
	var sessionPublicRSA = (await getSessionRSA({
		sessionKey:sessionKey
	},serverRSA)).publicKey;
	
	var JSONString = JSON.stringify({
		sessionPassword:sessionPassword,
		password:password
	})
	
	var encryptedData = encryptRSAToBufferArray(JSONString,sessionPublicRSA);

	var url = ServerType+'://'+SSHServer+':'+NodeJSPort+'/change-password';

	var response = await postRSAMessageToServer(url,{
		sessionKey:sessionKey,
		encrypted:encryptedData,
		surprise:"true"
	},serverRSA);
}

module.exports = {registerUser,changePasswordBySession};