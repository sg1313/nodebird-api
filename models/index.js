'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const Domain = require('./domain');

const User = require('./user');
const Post = require('./post');
const Hashtag = require('./hashtag');
// index.js 자동으로 생성되면 let sequelize 어쩌구 밑에 소스들이 위에 모델들 자동으로 연결해줌
const Guestbook = require('./guestbook');
const db = {};

const sequelize = new Sequelize(
    config.database, config.username, config.password, config,
);

db.sequelize = sequelize;
db.User = User;
db.Post = Post;
db.Hashtag = Hashtag;
db.Domain = Domain;
db.Guestbook = Guestbook;

User.init(sequelize);
Post.init(sequelize);
Hashtag.init(sequelize);
Domain.init(sequelize);
Guestbook.init(sequelize);

User.associate(db);
Post.associate(db);
Hashtag.associate(db);
Domain.associate(db);
Guestbook.associate(db);

module.exports = db;
