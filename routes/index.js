// import libraries
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
//db connections, get poll database
var mongo_url = "mongodb://user1:user1@ds159237.mlab.com:59237/wildhack";

mongoose.connect(mongo_url);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
var PollSchema = require('../models/poll.js').PollSchema;
var Poll = db.model('polls', PollSchema);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Polls' });
});

// JSON API for list of polls
router.get('/polls/polls', function(req, res, next){
	Poll.find({}, 'question', function(error, polls){
		res.json(polls);
	});
});
// display specific question poll result
router.get('/polls/:id', function(req,res,next){
	var pollId = req.params.id;
  	Poll.findById(pollId, '', { lean: true }, function(err, poll) {
    if(poll) {
      var userVoted = false,
          userChoice,
          totalVotes = 0;
      for(c in poll.choices) {
        var choice = poll.choices[c]; 
        for(v in choice.votes) {
          var vote = choice.votes[v];
          totalVotes++;
          if(vote.user === "Daniel") {
            userVoted = true;
            userChoice = { _id: choice._id, text: choice.text };
          }
        }
      }
      poll.userVoted = userVoted;
      poll.userChoice = userChoice;
      poll.totalVotes = totalVotes;
      res.json(poll);
    } else {
      res.json({error:true});
    }
  });
})

router.post('/polls', function(req,res,next){
	var reqBody = req.body,
      choices = reqBody.choices.filter(function(v) { return v.text != ''; }),
      pollObj = {question: reqBody.question, choices: choices};
    console.log(choices)
  	var poll = new Poll(pollObj);
  	poll.save(function(err, doc) {
    if(err || !doc) {
      throw 'Error';
    } else {
      res.json(doc);
    }   
  });
})


// Socket Api for vote
router.vote = function(socket){
	console.log("vote is called");
	socket.on('send:vote', function(data) {
      //var ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address.address;
      var user = "Paul";
      Poll.findById(data.poll_id, function(err, poll) {
      var choice = poll.choices.id(data.choice);
      console.log(data, choice.votes);
      choice.votes.push({ user: user});      
      poll.save(function(err, doc) {
        var theDoc = { 
          question: doc.question, _id: doc._id, choices: doc.choices, 
          userVoted: false, totalVotes: 0 
        };
        for(var i = 0, ln = doc.choices.length; i < ln; i++) {
          var choice = doc.choices[i]; 
          for(var j = 0, jLn = choice.votes.length; j < jLn; j++) {
            var vote = choice.votes[j];
            theDoc.totalVotes++;
            theDoc.user = user;
            if(vote.user === user) {
              theDoc.userVoted = true;
              theDoc.userChoice = { _id: choice._id, text: choice.text };
            }
          }
        }       
        socket.emit('myvote', theDoc);
        socket.broadcast.emit('vote', theDoc);
        });     
      });
    });
};


module.exports = router;
