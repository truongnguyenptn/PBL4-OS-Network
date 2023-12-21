const { sqlitedb } = require('./DBInit');
const { Sequelize, DataTypes,Model } = require('sequelize');

class AdminLogin extends Model {}
AdminLogin.init({
	id: {
		type: DataTypes.BIGINT,
		autoIncrement:true,
		primaryKey:true,
		unique:true
	},
	ipAddress:{
		type:DataTypes.STRING,
		unique:true,
		allowNull:false
	},
	tries:{
		type:DataTypes.INTEGER,
		allowNull:false
	},
	sessionKey:{
		type:DataTypes.STRING,
		unique:true,
		allowNull:true
	},
	banExpiration:{
		type: DataTypes.DATE,
		set(timestamp){
			this.setDataValue('banExpiration',timestamp != null ? new Date(Date.now()+timestamp ) : null);
		}
	}
},{
	sequelize:sqlitedb
});

sqlitedb.sync(
//{alter:true}
);

module.exports = {AdminLogin}