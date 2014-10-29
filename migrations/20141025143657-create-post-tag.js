"use strict";
module.exports = {
  up: function(migration, DataTypes, done) {
    migration.createTable("PostsTags", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      PostId: {
        type: DataTypes.INTEGER
      },
      TagId: {
        type: DataTypes.INTEGER
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
    migration.dropTable("PostsTags").done(done);
  }
};