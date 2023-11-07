const { sqlitedb } = require('./DBInit');
const { Sequelize, DataTypes,Model } = require('sequelize');

const { User } = require('./User');

class Session extends Model {}
Session.init({
	id: {
		type: DataTypes.BIGINT,
		autoIncrement:true,
		primaryKey:true,
		unique:true
	},
	sessionKey:{
		type:DataTypes.STRING,
		unique:true,
		allowNull:false
	},
	sessionPassword:{
		type:DataTypes.STRING,
		unique:true,
		allowNull:false
	},
	privateKey:{
		type: DataTypes.TEXT,
		null:false,
	},
	publicKey:{
		type: DataTypes.TEXT,
		null:false,
	},
	expiration:{
		type: DataTypes.DATE,
		null:false,
		set(timestamp){
			this.setDataValue('expiration',new Date(Date.now()+timestamp));
		}
	},isValid:{
		type:DataTypes.BOOLEAN
	}
},{
	sequelize:sqlitedb
});

User.hasMany(Session);
Session.belongsTo(User);

class SessionType extends Model {}

SessionType.init({
	id: {
		type: DataTypes.BIGINT,
		autoIncrement:true,
		primaryKey:true,
		unique:true
	},
	type:{
		type:DataTypes.STRING,
		unique:true,
		allowNull:false
	}
},{
	sequelize:sqlitedb
});

SessionType.hasMany(Session);
Session.belongsTo(SessionType);

async function getLoginSessionType(){
	return (await SessionType.findOrCreate({
		where: { type : 'login' },
	}))[0];
}

async function getChangePasswordSessionType(){
	return (await SessionType.findOrCreate({
		where: { type : 'changePassword' },
	}))[0];
}

sqlitedb.sync(
//{alter:true}
);



module.exports = {Session,SessionType,getLoginSessionType,getChangePasswordSessionType};