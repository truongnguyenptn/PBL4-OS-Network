const { sqlitedb } = require('./DBInit');
const { Sequelize, DataTypes,Model } = require('sequelize');

class IPAddress extends Model {}
IPAddress.init({
	id: {
		type: DataTypes.BIGINT,
		autoIncrement:true,
		primaryKey:true,
		unique:true
	},
	ipaddress:{
		type: DataTypes.TEXT,
		null:false,
		unique:true
	},
},{
	sequelize:sqlitedb
})

sqlitedb.sync();

exports.IPAddress = IPAddress;