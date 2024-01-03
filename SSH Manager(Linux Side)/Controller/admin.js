const fs = require('fs');

const { User } = require('.././Database/User');
const { AdminLogin } = require('.././Database/AdminLogin');
const { getSession,getChangePasswordSession,generateRandomString,createLoginSession } = require('.././Controller/session');
const { updateUser,generateChangePasswordSession,activateUser } = require('.././Controller/user');
const { changePasswordExpiration,sessionKeyLength,loginExpiration,banExpiration,maxLoginTries,maxSessionRefresh } = require('.././getConfig');

const { enableSSHUser,disableSSHUser,getSSHUsersList } = require('.././Exec/exec');

var AdminCurrentSessionKey;
var AdminCurrentSessionPassword;
var globalLoginTries = 0;

function refreshSessionKey(){
	AdminCurrentSessionKey = generateRandomString(sessionKeyLength);
	AdminCurrentSessionPassword = generateRandomString(sessionKeyLength);
	showSession();
	fs.writeFileSync('./adminLogin.txt', 
`
Here the session codes to login as Admin(Remember don't share it to anyone else):

Session Key:${AdminCurrentSessionKey}

Session Password:${AdminCurrentSessionPassword}
`);
}

async function getAdminLogin(ipAddress){
	return await AdminLogin.findOne({
		where: {
			ipAddress:ipAddress
		}
	}) 
	|| 
	AdminLogin.create({
		ipAddress:ipAddress,
		tries:0,
		sessionKey:null,
		banExpiration:null
	});
}

function showSession(){
	console.log(
`
Here the session codes to login as Admin(Remember only share to administrator):

Session Key:${AdminCurrentSessionKey}

Session Password:${AdminCurrentSessionPassword}
`);
}

async function loginAdmin(req,query){
	var message = {};
	try{
		var ip_address = req.ip;
		var app_session = req.session;

		var admin_login = await getAdminLogin(ip_address);
		
		if(admin_login.banExpiration != null && admin_login.banExpiration < new Date(Date.now())){
			await admin_login.update({
				tries: 0,
				banExpiration:null
			});
		}

		console.log(query.sessionKey);
		console.log(query.sessionPassword);
		showSession();

		console.log(query.sessionKey === AdminCurrentSessionKey && query.sessionPassword === AdminCurrentSessionPassword);

		if(admin_login.banExpiration == null && query.sessionKey === AdminCurrentSessionKey && query.sessionPassword === AdminCurrentSessionPassword){
			await createLoginSession(AdminCurrentSessionKey,AdminCurrentSessionPassword);
			await admin_login.update({
				tries:0,
				sessionKey:AdminCurrentSessionKey
			});
			app_session.sessionKey = AdminCurrentSessionKey;
			app_session.sessionPassword = AdminCurrentSessionPassword;
			refreshSessionKey();
			message = {
				status:'succeeded',
				message:'Login succeeded.'
			}
		}else{
			globalLoginTries += 1;
			console.log(`Global Login Tries:${globalLoginTries}`);
			if(globalLoginTries === maxSessionRefresh){
				refreshSessionKey();
				globalLoginTries = 0;
			}

			admin_login = await getAdminLogin(ip_address);
			if(admin_login.tries <  maxLoginTries){
				await admin_login.update({
					tries: admin_login.tries+1,
				});
			}
			

			if(admin_login.tries === maxLoginTries && admin_login.banExpiration == null){
				await admin_login.update({
					banExpiration:banExpiration
				});
			}
			if(admin_login.tries >= maxLoginTries){
				message = {
					message:`Login failed. You have banned until ${admin_login.banExpiration}`,
					status:"failed"
				};
			}else{
				message = {
					message:`Login failed. You have ${maxLoginTries - admin_login.tries} tries`,
					status:"failed"
				};
			}
			
		}
		
		
	}catch(err){
		console.log(err);
		message = {
			message:'Error Occured',
			status:"failed"
		};
	}
	return JSON.stringify(message);
}

async function logoutAdmin(req){
	try{
		session = await getSession(req.session.sessionKey);
		await session.update({
			isValid:false,
			expiration:0
		});
		req.session.sessionKey = undefined;
		req.session.sessionPassword = undefined;
	}catch(e){
		
	}
	
}

async function checkAdminLogin(req){
	if(req.session.sessionKey === undefined) return false;
	session = await getSession(req.session.sessionKey);
	return session !== null && req.session.sessionPassword == session.sessionPassword && session.expiration > new Date(Date.now()) && session.isValid;
}

async function getInactivatedUsers(req,query){
	var message = {};
	try{
		if(await checkAdminLogin(req)){
			message.status = 'succeeded';
			message.sessionKey = req.sessionKey;
			message.usersList = [];
			var inactivatedUsers = await User.findAll({
				where:{
					isAdded:false
				}
			});
			for(let i = 0;i<inactivatedUsers.length;i++){
				var user = inactivatedUsers[i];
				message.usersList.push({
					"id":user.id,
					"firstname":user.firstname,
					"lastname":user.lastname,
					"username":user.username,
					"email":user.email,
					"description":user.description,
				})
			}

		}else{
			message.status = 'failed';
			message.message = 'Login Session expired.'
		}
		
	}catch(err){
		console.log(err);
		message = {
			message:'Error Occured',
			status:"failed"
		};
	}
	return JSON.stringify(message);
}
async function getActiveUsers(req,query){
	var message = {};
	try{
		if(await checkAdminLogin(req)){
			message.status = 'succeeded';
			message.sessionKey = req.sessionKey;
			message.usersList = [];
			var activeUserList = await getSSHUsersList();
			for(let i = 0;i<activeUserList.length;i++){
				var user = await User.findOne({
					where:{
						username:activeUserList[i],isAdded:true
					}
				});
				if(user!=null){
					message.usersList.push({
						"id":user.id,
						"firstname":user.firstname,
						"lastname":user.lastname,
						"username":user.username,
						"email":user.email,
						"description":user.description,
					})
				}
				
			}

		}else{
			message.status = 'failed';
			message.message = 'Login Session expired.'
		}
		
	}catch(err){
		console.log(err);
		message = {
			message:'Error Occured',
			status:"failed"
		};
	}
	return JSON.stringify(message);
}
async function getBlockedUsers(req,query){
	var message = {};
	try{
		if(await checkAdminLogin(req)){
			message.status = 'succeeded';
			message.sessionKey = req.sessionKey;
			message.usersList = [];
			var addedUsers = await User.findAll({
				where:{
					isAdded:true
				}
			});
			var activeUserList = await getSSHUsersList();
			for(let i = 0;i<addedUsers.length;i++){
				var user = addedUsers[i];
				var index = activeUserList.indexOf(user.username);
				if(index > -1){
					activeUserList.splice(index,1);
				}else{
					message.usersList.push({
						"id":user.id,
						"firstname":user.firstname,
						"lastname":user.lastname,
						"username":user.username,
						"email":user.email,
						"description":user.description,
					})
				}
				
			}

		}else{
			message.status = 'failed';
			message.message = 'Login Session expired.'
		}
		
	}catch(err){
		console.log(err);
		message = {
			message:'Error Occured',
			status:"failed"
		};
	}
	return JSON.stringify(message);
}

async function enableUser(req,query){
	var message = {};
	try{
		if(await checkAdminLogin(req)){
			var user = await User.findOne({
				where:{id:query.id}
			})
			if(user!=null){
				await enableSSHUser(user.username);
				message.status = 'succeeded';
				message.message = 'User enabled successfully.'
			}else{
				throw new Error('User not found.');
			}
			
		}else{
			message.status = 'failed';
			message.message = 'Login Session expired.'
		}
		
	}catch(err){
		console.log(err);
		message = {
			message:err.message,
			status:"failed"
		};
	}
	return JSON.stringify(message);
}

async function disableUser(req,query){
	var message = {};
	try{
		if(await checkAdminLogin(req)){
			var user = await User.findOne({
				where:{id:query.id}
			})
			if(user!=null){
				await disableSSHUser(user.username);
				message.status = 'succeeded';
				message.message = 'User disabled successfully.'
			}else{
				throw new Error('User not found.');
			}
			
		}else{
			message.status = 'failed';
			message.message = 'Login Session expired.'
		}
		
	}catch(err){
		console.log(err);
		message = {
			message:err.message,
			status:"failed"
		};
	}
	return JSON.stringify(message);
}

async function adminActivateUser(req,query){
	var message = {};
	try{
		if(await checkAdminLogin(req)){
			var user = await User.findOne({
				where:{id:query.id}
			})
			if(user!=null){
				await activateUser(user);
				message.status = 'succeeded';
				message.message = 'Account activated successfully.'
			}else{
				throw new Error('User not found.');
			}
			
		}else{
			message.status = 'failed';
			message.message = 'Login Session expired.'
		}
		
	}catch(err){
		console.log(err);
		message = {
			message:err.message,
			status:"failed"
		};
	}
	return JSON.stringify(message);
}

async function adminGenerateChangePasswordSession(req,query){
	var message = {};
	try{
		if(await checkAdminLogin(req)){
			var user = await User.findOne({
				where:{id:query.id}
			})
			if(user!=null){
				await generateChangePasswordSession(user);
				message.status = 'succeeded';
				message.message = 'Change Password Session succeeded.'
			}else{
				throw new Error('User not found.');
			}
			
		}else{
			message.status = 'failed';
			message.message = 'Login Session expired.'
		}
		
	}catch(err){
		console.log(err);
		message = {
			message:err.message,
			status:"failed"
		};
	}
	return JSON.stringify(message);
}

async function adminUpdateUser(req,query){
	var message = {};
	try{
		if(checkAdminLogin(req)){
			
			message = JSON.parse(await updateUser(query));
			
		}else{
			message.status = 'failed';
			message.message = 'Login Session expired.'
		}
		
	}catch(err){
		console.log(err);
		message = {
			message:err,
			status:"failed"
		};
	}
	return JSON.stringify(message);
}


refreshSessionKey();

module.exports = {
	showSession,loginAdmin,checkAdminLogin,logoutAdmin,
	getInactivatedUsers,getActiveUsers,getBlockedUsers,
	adminUpdateUser,enableUser,disableUser,adminActivateUser,adminGenerateChangePasswordSession
};
