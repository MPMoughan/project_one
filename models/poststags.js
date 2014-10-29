"use strict";

module.exports = function(sequelize, DataTypes) {
  var PostsTags = sequelize.define("PostsTags", {
    PostId: DataTypes.INTEGER,
    TagId: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(db) {
       db.PostsTags.belongsTo(db.Post);
       db.PostsTags.belongsTo(db.Tag);
      }
    }
  });

  return PostsTags;
};
