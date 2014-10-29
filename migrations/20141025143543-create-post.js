"use strict";
module.exports = {
  up: function(migration, DataTypes, done) {
    migration.createTable("Posts", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      placeholder: {
        type: DataTypes.STRING
      },
      title: {
        type: DataTypes.STRING
      },
      body: {
        type: DataTypes.TEXT
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE
      },
      UserId: {
        type: DataTypes.INTEGER,
        foreignKey: true
      },
      TagId: {
        type: DataTypes.INTEGER,
        foreignKey: true
      }
    }).done(done);
  },
  down: function(migration, DataTypes, done) {
    migration.dropTable("Posts").done(done);
  }
};