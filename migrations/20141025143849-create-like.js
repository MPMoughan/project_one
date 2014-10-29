"use strict";
module.exports = {
  up: function(migration, DataTypes, done) {
    migration.createTable("Likes", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      PostId: {
        type: DataTypes.INTEGER
      },
      UserId: {
        type: DataTypes.INTEGER
      },
      isLiked: {
        type: DataTypes.BOOLEAN,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE
      }
    }).done(done);
  },
  down: function(migration, DataTypes, done) {
    migration.dropTable("Likes").done(done);
  }
};