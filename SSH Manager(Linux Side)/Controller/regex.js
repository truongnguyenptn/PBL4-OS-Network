var usernameRegex = /^([a-z_][a-z0-9_-]{0,30})$/;
var emailRegex = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
var nameRegex = /^.{0,255}$/;
var descriptionRegex = /^.{0,1024}$/;

module.exports = {usernameRegex,emailRegex,nameRegex,descriptionRegex};