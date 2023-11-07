var fs = require('fs');
var nodemailer = require('nodemailer');

const email_config = JSON.parse(fs.readFileSync('./Email/config.json', 'utf8'));

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: email_config.user,
    pass: email_config.password
  }
});

function sendPlainTextMail(receiver,subject,text){
	var mailOptions = {
	  from: email_config.user,
	  to: receiver,
	  subject: subject,
	  text: text
	};

	transporter.sendMail(mailOptions, function(error, info){
	  if (error) {
	    console.log(error);
	  } else {
	    console.log('Email sent: ' + info.response);
	  }
	});
}

module.exports = { sendPlainTextMail }