const { Op } = require("sequelize");
var { User } = require('.././Database/User');
var { Session } = require('.././Database/Session');
var {usernameRegex,emailRegex,nameRegex,descriptionRegex} = require('./regex');

var { generateRSA,decryptRSA,encryptRSA,decryptRSAFromBufferArray,encryptRSAToBufferArray } = require("./rsa");
var { createChangePasswordSession,getSession,getChangePasswordSession } = require("./session");

var { sendPlainTextMail } = require('.././Email/email.js');

var { addLinuxUser,changeLinuxPassword } = require('.././Exec/exec');

async function getActivatedUser(query){
	return await User.findOne({
		where:{
			email:query.email, 
			isAdded:true
		}
	});
}

async function registerUser(query){
	var message = {};
	try{
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
			description:query.description,
			isAdded:false
		});
		
		message = {
			status:'succeeded',
			message:'User Registration complete.'
		}
	}catch(err){
		message = {
			message:err.message,
			status:"failed"
		};
	}
	return JSON.stringify(message);
}

async function changePasswordUsingSession(query){
	var responseMessage;
	try{
		console.log(query.sessionKey);
		var session = await getChangePasswordSession(query.sessionKey);

		if(session === null) throw new Error("Session Key or/and Session Password is wrong.");

		var innerJSONBufferArray = JSON.parse(query.encrypted);

		var innerBufferArray = [];
		for(i = 0;i < innerJSONBufferArray.length;i++){
			innerBufferArray.push(new Buffer.from(innerJSONBufferArray[i]));
		}

		var innerDecrypted = JSON.parse(decryptRSAFromBufferArray(innerBufferArray,session.privateKey));
		if (session.sessionPassword !== innerDecrypted.query.sessionPassword){
			throw new Error("Session Key or/and Session Password is wrong.");
		}

		var user = await User.findOne({
			where:{
				id:session.UserId,
				isAdded:true
			}
		})

		await changeLinuxPassword(user.username,innerDecrypted.query.password);

		await session.update({
			isValid:false,
			expiration:new Date(),
		})
		await session.save();

		sendPlainTextMail(user.email,
`Password Changed`,
`Your account(${user.username}) password has been changed. 


If you have any problem, please contact to us.
Thank for using our service.`);

		responseMessage = {
			status:'succeeded',
			message:'Password successfully changed'
		}

	}catch(err){
		console.log(err);
		responseMessage = {
			status:"failed",
			message: err.message
		}
	}
	return responseMessage;
}

async function activateUser(user){
	var responseMessage;
	try{
	await addLinuxUser(user.username,'',user.firstname + ' ' + user.lastname,user.email);
	await user.update({
		isAdded:true
	});
	await user.save();
	var session = (await Session.findOne({
		where:{
			UserId:user.id,
			isValid:true,
			expiration:{
				[Op.gte]:new Date()
			}
		}
	})) || (await createChangePasswordSession(user));
	sendPlainTextMail(user.email,
`Registration Complete`,
`Congratulation. Your account(${user.username}) have been activated by us. 
To make your account usable, Please follow below steps:

1.In the Login form, click 'Forget your password?', Then you will be redirected to Forget Password.
2.In the Forget Password form, click 'I already have session codes'.
3.Copy Sesion Key and Session Password and paste to the Second Step form
4.Enter your password, then check if you can login to the SSH

Remember, The Session Code is Single-Use and can affect to your account, so don't give it to anyone.Here the Session Key and Password:

Session Key:${session.sessionKey}

Session Password:${session.sessionPassword}

If you get error 'Session Key or/and Session Password is wrong.' when using the above Session Codes, it means the Session Codes have been used or expired.
If you want to change your password, Please follow below steps:

1.In the Login form, click 'Forget your password?', Then you will be redirected to Forget Password.
2.In the Forget Password form, Enter your email and click "Next".
3.Your will be received new Session Codes in a new mail
4.Copy that Sesion Key and Session Password and paste to the Second Step form
5.Enter your password, then check if you can login to the SSH

If you have any problem, please contact to us.
Thank for using our service.`);
	responseMessage = {
		status:"succeeded",
		message:"Account activated."
	}
	}catch(err){
		responseMessage = {
			status:"succeeded",
			messager:err
		}
	}
	return responseMessage;
}
async function generateChangePasswordSession(user){
	console.log(user);
	var responseMessage;
	try{
	//if(!user.isAdded) throw ("Username/Email not exists");
	var session = (await Session.findOne({
		where:{
			UserId:user.id,
			isValid:true,
			expiration:{
				[Op.gte]:new Date()
			}
		}
	})) || (await createChangePasswordSession(user));

	sendPlainTextMail(user.email,
`Session have been generated to reset your password`,
`We have send Session code to reset your account(${user.username}) password. 
To change your account password, Please follow below steps:

1.In the Login form, click 'Forget your password?', Then you will be redirected to Forget Password.
2.In the Forget Password form, click 'I already have session codes'.
3.Copy Sesion Key and Session Password and paste to the Second Step form
4.Enter your password, then check if you can login to the SSH

Remember, The Session Code is Single-Use and can affect to your account, so don't give it to anyone.Here the Session Key and Password:

Session Key:${session.sessionKey}

Session Password:${session.sessionPassword}

If you get error 'Session Key or/and Session Password is wrong.' when using the above Session Codes, it means the Session Codes have been used or expired.
If you want to change your password, Please follow below steps:

1.In the Login form, click 'Forget your password?', Then you will be redirected to Forget Password.
2.In the Forget Password form, Enter your email and click "Next".
3.Your will be received new Session Codes in a new mail
4.Copy that Sesion Key and Session Password and paste to the Second Step form
5.Enter your password, then check if you can login to the SSH

If you have any problem, please contact to us.
Thank for using our service.`);
	responseMessage = {
		status:"succeeded",
		message:"Session is generated and sent to your mail."
	}
	}catch(err){
		responseMessage = {
			status:"succeeded",
			message:"Session is failed to be generated."
		}
	}
	return responseMessage;
}
module.exports = {getActivatedUser,registerUser,changePasswordUsingSession,activateUser,generateChangePasswordSession};