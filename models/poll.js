var mongoose = require('mongoose');
var voteSchema = new mongoose.Schema({user: String});
var voterSchema = new mongoose.Schema({voter: String});
var choiceSchma = new mongoose.Schema({
	text : String,
	votes : [voteSchema]
});
exports.PollSchema = new mongoose.Schema({
	question: {type: String, required: true},
	choices: [choiceSchma],
	voters: [voterSchema]
});