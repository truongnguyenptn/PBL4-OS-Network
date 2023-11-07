var { refreshRSA,getRSAFromServer,generateRSA,getSessionRSA } = require('./rsa');
var { changePasswordBySession } = require('./user');
const serverRSA = generateRSA();

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

(async () => {
	console.log(await getSessionRSA({
		sessionKey:"6pVLkmUx0BXYBXVwIbPUcCUeIHgK0OUfGNXe9S1gtfdQiiYBCsDd6EIFog6Ykvz7"
	},serverRSA));
	console.log(await changePasswordBySession("6pVLkmUx0BXYBXVwIbPUcCUeIHgK0OUfGNXe9S1gtfdQiiYBCsDd6EIFog6Ykvz7",
		"asdaewrwrerwerweeeeriwejroiewrjiwejirrrrrrrrrrrrrrrrrrrrrrrrrrrwoeijroweijrowiejroiwjerojewirjoweirjwoeirjoweirjoweirjoweijroweijrowiejrowejoriwjeiroweijroweijroiiwejroiewjroiwejroweijroweijroweirjowerijd","asdasdasd",serverRSA));
	console.log('done');
})();
