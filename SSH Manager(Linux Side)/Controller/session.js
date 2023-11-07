const { Op } = require('sequelize');
const { User } = require('.././Database/User');
const { Session,SessionType,getChangePasswordSessionType } = require('.././Database/Session');
const crypto = require('crypto');

const { changePasswordExpiration,sessionKeyLength } = require('.././getConfig');

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

module.exports = { createChangePasswordSession,getSession,getChangePasswordSession }