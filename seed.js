var db = require("./models/index");


db.User.create({
  username: "Jennifer",
  password: "secretPassword",
  email: "Jennifer@Moughan.com",
  location: "Barrington, IL"
}).done(function (err, user) {
  db.Post.create({
    placeholder: "TEXT 2",
    title: "Title 2",
    body: "2nd Body"
  }).done(function (err, post) {
    //user.addPost(post);
    post.setUser(user);
  });
});


db.Like.create({
  isLiked: true
}).done(function (err, like) {
  db.User.find({where: {username: "Jennifer"}}).done(function (err, matt) {
    db.Post.find({where: {title: "Title 2"}}).done(function (err, post) {
      like.setUser(matt);
      like.setPost(post);
    });
  });
});


db.Tag.create({
  name: "stuff"
});

db.PostsTags.create({
  PostId: 3,
  TagId: 1,
});

