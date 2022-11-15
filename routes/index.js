const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { User, Domain } = require('../models');
const { isLoggedIn } = require('./middlewares');

const router = express.Router();

router.get('/', async (req, res, next) => {
    try { // 리액트에서 / 주소로 들어가면 아래 함수가 실행됨
        const user = await User.findOne({
            where: { id: req.user && req.user.id || null },
            include: { model: Domain },
        });
        res.render('login', {  // view단의 login.html 부름
            user,
            domains: user && user.Domains,
        });
    } catch (err) {
        console.error(err);
        next(err);
    }
});

router.post('/domain', isLoggedIn, async (req, res, next) => {
    try {  // 그림10-4) 도메인 등록화면에서 도메인 받아서 db에 저장
        await Domain.create({
            UserId: req.user.id,
            host: req.body.host,
            type: req.body.type,
            clientSecret: uuidv4(),
        });
        res.redirect('/');
    } catch (err) {
        console.error(err);
        next(err);
    }
});

module.exports = router;