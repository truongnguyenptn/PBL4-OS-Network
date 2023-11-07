const { sqlitedb } = require('./DBInit');
const { Sequelize, DataTypes,Model } = require('sequelize');
const {usernameRegex,emailRegex,nameRegex,descriptionRegex} = require(".././Controller/regex");

//Middleware Backup User
class User extends Model {}
User.init({
	id: {
		type: DataTypes.BIGINT,
		autoIncrement:true,
		primaryKey:true,
		unique:true
	},
	firstname:{
		type: DataTypes.TEXT,
		set(value){
			if(!nameRegex.test(value)) throw new Error("First Name is not valid");
			this.setDataValue('firstname',value);
		}
	},
	lastname:{
		type:DataTypes.TEXT,
		set(value){
			if(!nameRegex.test(value)) throw new Error("Last Name is not valid");
			this.setDataValue('lastname',value);
		}
	},
	username:{
		type:DataTypes.STRING,
		unique:true,
		allowNull:false,
		set(value){
			if(!usernameRegex.test(value)) throw new Error("Username is not valid");
			this.setDataValue('username',value);
		}
	},
	email:{
		type:DataTypes.STRING,
		unique:true,
		allowNull:false,
		set(value){
			if(!emailRegex.test(value)) throw new Error("Email is not valid");
			this.setDataValue('email',value);
		}
	},
	description:{
		type:DataTypes.TEXT,
		set(value){
			if(!descriptionRegex.test(value)) throw new Error("Description is not valid");
			this.setDataValue('description',value);
		}
	},isAdded:{
		type:DataTypes.BOOLEAN
	}
},{
	sequelize:sqlitedb
})

sqlitedb.sync(
//{alter:true}
);

exports.User = User;