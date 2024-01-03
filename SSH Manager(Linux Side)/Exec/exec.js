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
	await executeCommand(`echo '${password}\n${password}\n${fullName}\n\n\n\n${email}\n' | adduser ${username}`);
	return await executeCommand(`usermod -a -G ssh-allowed ${username}`);
}

async function disableSSHUser(username){
	return await executeCommand(`gpasswd --delete ${username} ssh-allowed`);
}
async function enableSSHUser(username){
	return await executeCommand(`usermod -a -G ssh-allowed ${username}`);
}
// async function delLinuxUser(username){
// 	return await executeCommand(`userdel ${username}`);
// }
async function getSSHUsersList(){
	var result = (await exec('getent group ssh-allowed')).stdout;
	result = result.split(":");
	result = result[result.length-1].slice(0,-1);
	result = result.split(",");
	return result;
}

// (async () => {
// 	addLinuxUser("stormyx123",'','Stormyx',"");
// })();

console.log("If you want to use Admin Page, you need to run the server in root privilege(or as a sudo-er).");

module.exports = { changeLinuxPassword,addLinuxUser,disableSSHUser,enableSSHUser,getSSHUsersList }