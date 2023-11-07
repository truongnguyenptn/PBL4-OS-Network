const { Sequelize } = require('sequelize');

const sqlitedb = new Sequelize({
  dialect: 'sqlite',
  storage: 'db.sqlite'
});
try {
  sqlitedb.authenticate();
  console.log('Connection has been established successfully.');
  
} catch (error) {
  console.error('Unable to connect to the database:', error);
}
sqlitedb.sync();

exports.sqlitedb = sqlitedb;