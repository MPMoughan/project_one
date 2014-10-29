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
routeMiddleware = require('./config/routes');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(express.static(__dirname + "/public"));

/// AWS CODE BY ELIE /////
var AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
var AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
var S3_BUCKET = process.env.S3_BUCKET;


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
  function(success){
    res.render("login", {message: success.message});
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



////////// S3 //////////
app.get('/sign_s3', function(req, res){
    var object_name = req.query.s3_object_name;
    var mime_type = req.query.s3_object_type;

    var now = new Date();
    var expires = Math.ceil((now.getTime() + 10000)/1000); // 10 seconds from now
    var amz_headers = "x-amz-acl:public-read";

    var put_request = "PUT\n\n"+mime_type+"\n"+expires+"\n"+amz_headers+"\n/"+S3_BUCKET+"/"+object_name;
    var signature = crypto.createHmac('sha1', AWS_SECRET_KEY).update(put_request).digest('base64');
    signature = encodeURIComponent(signature.trim());
    signature = signature.replace('%2B','+');

    var url = 'https://'+S3_BUCKET+'.s3.amazonaws.com/'+object_name;

    var credentials = {
        signed_request: url+"?AWSAccessKeyId="+AWS_ACCESS_KEY+"&Expires="+expires+"&Signature="+signature,
        url: url
    };
    res.write(JSON.stringify(credentials));
    res.end();
});
//// END ////

// HOME PAGE - render latest posts
app.get('/home', routeMiddleware.checkAuthentication, function (req, res){
    db.Post.findAll().done(function (err, posts){
      console.log("YOU FUCK UP?",posts)
    res.render('home', {posts: posts, user: req.user});
    });
  });


/////////// USER ///////////
// USRE PROFILE PAGE
app.get('/profile/:id', routeMiddleware.checkAuthentication, function (req,res){
  console.log("User "+req.user.id);
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
      res.render('profile', {posts:posts, user:user});
      });
    }
   });
  }
});

// EDIT user - direct to edit forms
app.get('/profile/:id/edit', routeMiddleware.checkAuthentication, function (req, res) {
  // var id = req.params.id;
  // db.User.find(id).success(function(user){
  //     res.render('edit', {user: user});
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
  var placeholder = req.body.placeholder;
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

// // EDIT POST
// app.get('/posts/:id/edit', routeMiddleware.checkAuthentication, function (req, res) {
//   //find our Post
//   var id = req.params.id;
//   db.Post.find(id).success(function(post){
//       res.render('post', {post: post});
//   });
// });

// // UPDATE post
// app.put('/posts/:id', function (req, res) {
//   var id = req.params.id;
//   db.Post.find(id).success(function(post){
//       post.updateAttributes
//       ({title: req.body.post.title, body: req.body.post.body
//       }).done(function(err, success){
//       if (err){
//         var errMsg = "Title must be at least 6 characters";
//         res.render('/posts/:id/edit', {errMsg:errMsg, post: post});
//         // why did you need to go through this
//       }
//       else {
//     res.redirect('/profile');
//       }
//     });
//   });
// });

// // DELETE
// app.delete('/posts/:id', function (req, res) {
//   var id = req.params.id;
//   db.Post.find(id).success(function(post){
//       post.destroy().success(function(){
//       res.redirect('/Posts');
//     });
//   });
// });
///////// END OF POST METHODS


// SEARCH page - search for specific tags
app.get('/search', routeMiddleware.checkAuthentication, function (req, res, TagId){
  db.PostsTags.findAll({
    where: {
      TagId: TagId
    }
  }).done(function (err, posts) {
    console.log("HERE ARE OUR POSTS",posts);
    res.render('search', {posts: posts});
  });
});


app.get('*', function (req,res){
  res.status(404);
  res.render('404');
});

var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});