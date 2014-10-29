"use strict";

module.exports = function(sequelize, DataTypes) {
  var Tag = sequelize.define("Tag", {
    name: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(db) {
        db.Tag.hasMany(db.Post);
        // db.Tag.hasMany(db.PostTag);
        // db.Tag.belongsTo(db.Post);
      }
    }
  });

  return Tag;
};
