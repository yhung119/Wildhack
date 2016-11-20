// import libraries
var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
//db connections, get poll database
var mongo_url = "mongodb://user1:user1@ds159237.mlab.com:59237/wildhack";
var passport = require('passport');

mongoose.connect(mongo_url);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
var PollSchema = require('../models/poll.js').PollSchema;
var Poll = db.model('polls', PollSchema);
var User = require('../models/user.js');
var curr_user = '';
///login
var isAuthenticated = function (req, res, next) {
  // if user is authenticated in the session, call the next() to call the next request handler 
  // Passport adds this method to request object. A middleware is allowed to add properties to
  // request and response objects
  if (req.isAuthenticated()){
    curr_user = req.user;
    return next();
  }
  // if the user is not authenticated then redirect him to the login page
  res.redirect('/')
}

//yelp api
var Yelp = require('yelp');

var yelp = new Yelp({
  consumer_key: 'gLuYHAYcXRewqUmCFD8nQw',
  consumer_secret: 'EKeSrHWDLxAcVtGfBlV1FPPVU7Y',
  token: 'MterUEI1N6NHEoI5PYOuy7R6miwTVzbV',
  token_secret: '4UsxJ_10D2vR7vNSwvgVIG5PYsE',
});

// Socket Api for vote
router.vote = function(socket){
  socket.on('send:vote', function(data) {
      var user = '';
      if(curr_user != ''){
        user = curr_user.id;
      }
      Poll.findById(data.poll_id, function(err, poll) {
      var choice = poll.choices.id(data.choice);
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


/* GET login page. */
router.get('/', function(req, res, next) {
    // Display the Login page with any flash message, if any

  res.render('index', { title : "Polls" });
});


/* GET Home Page */
router.get('/home', isAuthenticated, function(req, res, next){
  res.render('poll', { title : 'Polls', user: req.user });
});

/* Handle Logout */
router.get('/signout', function(req, res, next) {
  req.logout();
  res.redirect('/');
});

// route for facebook authentication and login
// different scopes while logging in
router.get('/login/facebook', 
  passport.authenticate('facebook', { scope : 'email' }
));

  // handle the callback after facebook has authenticated the user
router.get('/login/facebook/callback',
  passport.authenticate('facebook', {
    successRedirect : '/home',
    failureRedirect : '/',
    scope: ['email', 'name']
  })
);

router.get('/ppap',function(req,res,next){
  res.render('home',{user: req.user});
})

  // JSON API for list of polls
router.get('/polls/polls', function(req, res, next){
  Poll.find({}, 'question', function(error, polls){
    res.json(polls);
  });
});
// display specific question poll result
router.get('/polls/:id', function(req,res,next){
  var user = req.user.id;
  var pollId = req.params.id;
    Poll.findById(pollId, '', { lean: true }, function(err, poll) {
    if(poll) {
      var temp_userVoted = false;
      for(c in poll.choices) {
        var choice = poll.choices[c]; 
        if(temp_userVoted){
          break;
        }
        for(v in choice.votes) {
          var vote = choice.votes[v];
          if(vote.user === user) {
            temp_userVoted = true;
            break;
          }
        }
      }
      var userVoted = temp_userVoted,
          userChoice,
          totalVotes = 0;
      for(c in poll.choices) {
        var choice = poll.choices[c]; 
        for(v in choice.votes) {
          var vote = choice.votes[v];
          totalVotes++;
          if(vote.user === user) {
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
  var user = req.user;
  console.log('user.preference',user.preference);
  var preference = user.preference;
  
  yelp.search({ term: "Mexican Food", location: 'Champaign' })
      .then(function (data) {
        //console.log(data.businesses);
        var food = data.businesses;
        var choices = [];
        for(var i = 0; i < 5; i++){
          choices.push({text: food[i].name, votes:[]});
        }
        console.log(choices);
        var pollObj = {question: 'Question 3', choices: choices};
        var poll = new Poll(pollObj);

        poll.save(function(err, doc) {
        if(err || !doc) {
          throw 'Error';
        } else {
          res.json(doc);
          //res.send({redirect: '/#/poll'+doc._id});
        }   
      })
      .catch(function (err) {
        console.error(err);
      });
    });

})





module.exports = router;
