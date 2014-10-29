"use strict";

module.exports = function(sequelize, DataTypes) {
  var Post = sequelize.define("Post", {
    placeholder: DataTypes.STRING,
    title: DataTypes.STRING,
    body: DataTypes.TEXT,
    UserId: DataTypes.INTEGER,
    TagId: DataTypes.INTEGER,
  }, {
    classMethods: {
      associate: function(db) {
        // db.Post.hasMany(db.User);
        db.Post.hasMany(db.Tag);
        // db.Post.hasMany(db.PostTag);
        db.Post.hasMany(db.Like);
        db.Post.belongsTo(db.User);
      }
    }
  });

  return Post;
};
