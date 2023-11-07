var fs = require('fs');
const data = fs.readFileSync('./config.json', 'utf8')
const config = JSON.parse(data);

module.exports = config;