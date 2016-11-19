var mongoose = require('mongoose');
var voteSchema = new mongoose.Schema({ip: 'String'});

var choiceSchma = new mongoose.Schema({
	text : String,
	vote : [voteSchema]
});
exports.PollSchema = new mongoose.Schema({
	question: {type: String, required: true},
	choices: [choiceSchma]
});