const { Op } = require('sequelize');
const { User } = require('.././Database/User');
const { Session,SessionType,getChangePasswordSessionType,getLoginSessionType } = require('.././Database/Session');
const crypto = require('crypto');

const { changePasswordExpiration,sessionKeyLength,loginExpiration } = require('.././getConfig');

async function createChangePasswordSession(user){
	var cpSessionType = await getChangePasswordSessionType();
	var rsa = crypto.generateKeyPairSync("rsa", {
	  modulusLength: 2048,
	});
	return await Session.create({
		sessionKey:generateRandomString(sessionKeyLength),
		sessionPassword:generateRandomString(sessionKeyLength),
		publicKey:rsa.publicKey.export({
		    type: 'pkcs1',
		    format: 'pem'
		}),
		privateKey:rsa.privateKey.export({
		    type: 'pkcs1',
		    format: 'pem'
		}),
		expiration:parseInt(changePasswordExpiration),
		isValid:true,
		UserId:user.id,
		SessionTypeId:cpSessionType.id
	});
}

async function createLoginSession(sessionKey,sessionPassword){
	var loginSessionType = await getLoginSessionType();
	return await Session.findOne({
		where: {
			sessionKey:sessionKey,
			sessionPassword:sessionPassword
		}
	}) || await Session.create({
		sessionKey:sessionKey,
		sessionPassword:sessionPassword,
		publicKey:null,
		privateKey:null,
		expiration:parseInt(loginExpiration),
		isValid:true,
		UserId:null,
		SessionTypeId:loginSessionType.id
	});
}

function generateRandomString(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

async function getSession(sessionKey){
	return await Session.findOne({
		where: {
			sessionKey:sessionKey,
			expiration:{
				[Op.gte]:new Date()
			},
			isValid:true
		}
	});
}

async function getChangePasswordSession(sessionKey){
	var cpSessionType = await getChangePasswordSessionType();
	return await Session.findOne({
		where: {
			sessionKey:sessionKey,
			expiration:{
				[Op.gte]:new Date()
			},
			isValid:true,
			SessionTypeId:cpSessionType.id
		}
	});
}



async function getLoginSession(sessionKey){
	var loginSessionType = await getLoginSessionType();
	return await Session.findOne({
		where: {
			sessionKey:sessionKey,
			expiration:{
				[Op.gte]:new Date()
			},
			isValid:true,
			SessionTypeId:loginSessionType.id
		}
	});
}

// (async () => {
// console.log(await getSession('du2DRqNUinn6k93Os75yshFd9bvGXclJga9OrhLuhQAVGZKQSfkxx0ulzxGOp4tDypW0eQdhmxWUfQGVHm3CRhi2xkw67fIOWq3OE3PF9hO70g9JZVog5Vl2cKWAdZgzyjjur7QGFgsvJ6dLD6T51ng0N3KqM5jrWhSi0I3LDro66cSJ8fFRYNZDWXTyrp8qMQLYyN79sdx9NLh003e8bfo2Fq0HluW1FxhuDMUlK9B7HUH5SUw3C8fJa7pnUYt6'));
// })();



module.exports = { createChangePasswordSession,createLoginSession,getSession,getChangePasswordSession,generateRandomString }