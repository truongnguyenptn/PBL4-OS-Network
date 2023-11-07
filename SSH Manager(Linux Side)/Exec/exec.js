const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);

//Please run this modules in root privilege(or as a sudo-er)

async function executeCommand(command) {
	try{
		await exec(command);
		return 0;
	}catch(e){
		console.log(e);
		return -1;
	}
}

async function changeLinuxPassword(username,newPassword){
	return await executeCommand(`echo '${newPassword}\n${newPassword}' | passwd ${username}`);
}

async function addLinuxUser(username,password,fullName,email){

	return await executeCommand(`echo '${password}\n${password}\n${fullName}\n\n\n\n${email}' | adduser ${username} | usermod -a -G ssh-allowed ${username}
`);
}
async function delLinuxUser(username){
	return await executeCommand(`userdel ${username}`);
}

module.exports = { changeLinuxPassword,addLinuxUser,delLinuxUser }