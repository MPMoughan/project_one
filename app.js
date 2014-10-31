"use strict"

var express = require("express"),
bodyParser = require("body-parser"),
app = express(),
db = require("./models/index"),
passport = require("passport"),
passportLocal = require("passport-local"),
cookieParser = require("cookie-parser"),
session = require("cookie-session"),
flash = require("connect-flash"),
crypto = require("crypto"),
http = require("http"),
path = require("path"),
methodOverride = require('method-override'),
routeMiddleware = require('./config/routes'),
nodemailer = require('nodemailer');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(express.static(__dirname + "/public"));

// setup session
app.use(session( {
  secret: 'thisismysecretkey',
  name: 'chocolate chip',
  maxage: 3600000
  })
);

// get passport started
app.use(passport.initialize());
app.use(passport.session());

// include flash message
app.use(flash());

// Serialize user
passport.serializeUser(function (user, done){
  console.log("SERIALIZED JUST RAN!");
  done(null, user.id);
});

// De-serialize user
passport.deserializeUser(function (id, done){
  console.log("DESERIALIZED JUST RAN!");
  db.User.find({
    where: {
      id: id
    }
  })
  .done(function(error,user){
    done(error, user);
  });
});

// Middleware for preventing re-signin or logging-in again
app.get('/', routeMiddleware.preventLoginSignup, function(req,res){
    res.render('land');
});

app.get('/signup', routeMiddleware.preventLoginSignup, function(req,res){
    res.render('signup', { username: ""});
});

app.get('/login', routeMiddleware.preventLoginSignup, function(req,res){
    res.render('login', {message: req.flash('loginMessage'), username: ""});
});

// Create a new users using form values
app.post('/submit', function(req,res){
  db.User.createNewUser(req.body.username, req.body.password, req.body.email, req.body.location,
  function(err){
    res.render("signup", {message: err.message, username: req.body.username});
  },
  function(){
    passport.authenticate('local')(req,res,function(){
      res.redirect("/home");
    });
  });
});

// Authenticate users when logging in - Passport
app.post('/login', passport.authenticate('local', {
  successRedirect: '/home',
  failureRedirect: '/login',
  failureFlash: true
}));

app.get('/logout', function(req,res){
  req.logout();
  res.redirect('/');
});


// HOME PAGE - render latest posts
app.get('/home', routeMiddleware.checkAuthentication, function (req, res){
    db.Post.findAll({include: [db.Like,db.User],order:[ ["createdAt", "DESC"] ] }).done(function (err, posts){
    console.log(posts)
    res.render('home', {posts: posts, user: req.user,count:0});
    });
  });


/////////// USER ///////////

// USRE PROFILE PAGE
app.get('/profile/:id', routeMiddleware.checkAuthentication, function (req,res){

    db.User.find(req.params.id).done(function(err, user){
    if(err || user === null ){
      res.redirect('/home');
    }
    else
    user.getPosts({include: [db.Like],order:[ ["createdAt", "DESC"] ] }).done(function(err,posts){
      res.render('profile', {posts:posts, user:user, currentUser:req.user});
      });
   });
  });

// EDIT user - direct to edit forms
// With logic to prevent another user from editing
app.get('/profile/:id/edit', routeMiddleware.checkAuthentication, function (req, res) {
  if(req.user.id !== parseInt(req.params.id)){
    res.redirect('/home');
  }
  else {
    db.User.find(req.params.id).done(function(err, user){
    if(err || user === null ){
      res.redirect('/home');
    }
    else {
    user.getPosts().done(function(err,posts){
      res.render('edit', {posts:posts, currentUser: user, user:user});
      });
    }
   });
  }
});

// UPDATE user info
app.put('/profile/:id', function (req, res) {
  var id = req.params.id;
  db.User.find(id).success(function(user){
      user.updateAttributes
      ({username: req.body.user.username, email: req.body.user.email, location: req.body.user.location
      }).done(function(err, success){
      if (err){
        var errMsg = "Title must be at least 6 characters";
        res.render('user/edit', {errMsg:errMsg, user:user});
        // why did you need to go through this
      }
      else {
    res.redirect('/profile/' + req.params.id);
      }
    });
  });
});

//DELETE user and all associated posts
app.delete('/profile/:id/edit', function (req, res) {
  var id = req.params.id;
  console.log("Deleting .. :" + id);

  db.User.find(id).success(function(user){
      // console.log("Found .. :" + user);
      db.Post.destroy({
        where: {
          UserId: user.id
          }
        }).done(function(){
      user.destroy().done(function(){
      res.redirect('/');
      });
    });
  });
});
/////////// END OF USER


//////// NEW POST ////////////
// New Post Form to upload photo
app.get('/posts/:id/new', routeMiddleware.checkAuthentication, function (req, res){
  if(req.user.id !== parseInt(req.params.id)){
    res.redirect('/home');
  }
  else {
    db.User.find(req.params.id).done(function(err, user){
    if(err || user === null ){
      res.redirect('/home');
    }
    else {
      res.render("post", {user:user});
      }
    });
  }
});

// Method to make a new post
app.post('/posts/:id', function (req, res) {
  var title = req.body.title;
  var body = req.body.body;
  console.log("BODY:",req.body);
  var placeholder = ("http://www.ucarecdn.com/"+req.body.placeholder+"/");

  db.Post.create({
    placeholder: placeholder,
    title: title,
    body: body,
    UserId: req.params.id
  })
    .done(function(err, success){
      if (err){
        var errMsg = "Title must be at least 6 characters";
        res.render('new', {errMsg: errMsg, placeholder: placeholder, title: title, body: body});
        // why is it render here? why not redirect?
      }
      else {
    res.redirect('/profile/' + req.params.id);
    }
  });
});

// EDIT POST
app.get('/posts/:id/edit', routeMiddleware.checkAuthentication, function (req, res) {
  db.Post.find(req.params.id).done(function(err,post){
    if(post.UserId !== req.user.id){
      res.redirect('/home');
    }
    else {
      res.render('postedit', {post:post, user:req.user});
    }
  });
});

// UPDATE post
app.put('/posts/:id', function (req, res) {
  var id = req.params.id;
  db.Post.find(id).success(function(post){
      post.updateAttributes
      ({placeholder: req.body.post.placeholder, title: req.body.post.title, body: req.body.post.body
      }).done(function(err, success){
      if (err){
        var errMsg = "Title must be at least 6 characters";
        res.render('/posts/:id/edit', {errMsg:errMsg, post: post});
        // why did you need to go through this
      }
      else {
    res.redirect('/home');
      }
    });
  });
});

// DELETE
app.delete('/posts/:id', function (req, res) {
  var id = req.params.id;
  db.Post.find(id).success(function(post){
      post.destroy().success(function(){
      res.redirect('/home');
    });
  });
});
///////// END OF POST METHODS


// LIKE BUTTON
app.post('/liked', function (req,res){
  var userId = req.body.UserId;
  var postId = req.body.PostId;
  var currentUserId = req.user.id;
  var isLiked;

  if(req.body.unlike){
    isLiked = false;
  }
  else{
    isLiked = true;
  }

  db.Like.findOrCreate({
    where: {
    PostId: postId,
    UserId: currentUserId,
    isLiked: true
    }
  }).done(function (err,liked){
      res.redirect('/home');
  });
});

// SEARCH page - search for specific tags
app.get('/search', routeMiddleware.checkAuthentication, function (req, res, TagId){
  db.PostsTags.findAll({
    where: {
      TagId: TagId
    }
  }).done(function (err, posts) {
    console.log("HERE ARE OUR POSTS",posts);
    res.render('search', {posts: posts, user:req.user});
  });
});

app.get('*', function (req,res){
  res.status(404);
  res.render('404',{user:req.user});
});

var server = app.listen(process.env.PORT || 3000, function() {
    console.log('Listening on port %d', server.address().port);
});