const { sqlitedb } = require('./DBInit');
const { Sequelize, DataTypes,Model } = require('sequelize');
const { IPAddress } = require('./IPAddress');

const crypto = require('crypto');

class RSA extends Model {}
RSA.init({
	id: {
		type: DataTypes.BIGINT,
		autoIncrement:true,
		primaryKey:true,
		unique:true
	},
	privateKey:{
		type: DataTypes.TEXT,
		null:false,
	},
	publicKey:{
		type: DataTypes.TEXT,
		null:false,
	}
},{
	sequelize:sqlitedb
})

IPAddress.hasOne(RSA);
RSA.belongsTo(IPAddress);

sqlitedb.sync();

exports.RSA= RSA;
