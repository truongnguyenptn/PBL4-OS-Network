const { sqlitedb } = require('./DBInit');
const { Sequelize, DataTypes,Model } = require('sequelize');
class Foo extends Model {}
Foo.init({
	id: {
	type: DataTypes.BIGINT,
	autoIncrement:true,
	primaryKey:true
	},
	bar: {
	type: DataTypes.STRING
	}
},{
	sequelize:sqlitedb
});

console.log(Foo);

const foo1 = Foo.create({bar:"afafadf"});

exports.Foo = Foo;

sqlitedb.sync();