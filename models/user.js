
var mongoose = require('mongoose');
var poll = require('./poll.js').PollSchema;
module.exports = mongoose.model('User',{
	id: String,
	access_token: String,
	firstName: String,
	lastName: String,
	email: String,
	owned: [poll],
	preference: [String]
});