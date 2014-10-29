"use strict";

module.exports = function(sequelize, DataTypes) {
  var Like = sequelize.define("Like", {
    PostId: DataTypes.INTEGER,
    UserId: DataTypes.INTEGER,
    isLiked: DataTypes.BOOLEAN
  }, {
    classMethods: {
      associate: function(db) {
        db.Like.belongsTo(db.Post);
        db.Like.belongsTo(db.User);
      }
    }
  });

  return Like;
};
