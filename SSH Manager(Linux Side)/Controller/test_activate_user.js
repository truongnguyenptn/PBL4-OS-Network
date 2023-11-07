const { User } = require('.././Database/User');
const { activateUser } = require('./user');

(async () => {
	var exampleUser = await User.findOne({
		where:{
			email:'anhoaduong2003@gmail.com'
		}
	});
	await activateUser(exampleUser);
})();