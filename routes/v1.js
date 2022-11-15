const express = require('express');
const jwt = require('jsonwebtoken');

const { verifyToken, deprecated } = require('./middlewares');
const { Domain, User, Post, Hashtag } = require('../models');
const {hash} = require("bcrypt");

const router = express.Router();

router.use(deprecated);


router.post('/token', async (req, res) => {
    const { clientSecret } = req.body;
    try {
        const domain = await Domain.findOne({
            where: { clientSecret },  // 클라이언트 비밀키
            include: {
                model: User,
                attribute: ['nick', 'id'],
            },
        });
        if (!domain) {
            return res.status(401).json({
                code: 401,
                message: '등록되지 않은 도메인입니다. 먼저 도메인을 등록하세요',
            });
        }
        const token = jwt.sign({
            id: domain.User.id,
            nick: domain.User.nick,
        }, process.env.JWT_SECRET, {
            expiresIn: '1m', // 1분
            issuer: 'nodebird',
        });
        return res.json({ // 토큰 보내기
            code: 200,
            message: '토큰이 발급되었습니다',
            token,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: '서버 에러',
        });
    }
});

//테스트
router.get('/test', verifyToken, (req, res) => {
    res.json(req.decoded);
});

// 나의 게시물 API 만들기
router.get('/posts/my', verifyToken, (req, res) => {
    Post.findAll({ where: { userId : req.decoded.id}})  // userid가 decoded.id된 모든 사람을 질의한다.
        .then((posts) => {
            console.log(posts);
            res.json({
                code : 200,
                payload : posts,  // 질의한 내용을 싣는다
            });
        })
        .catch((error) => {
            console.error(error);
            return res.status(500).json({
                code: 500,
                message : '서버 에러',
            });
        });
});

// 해시태그 API 만들기
router.get('/posts/hashtag/:title', verifyToken, async (req, res) => {
    try {
        const hashtag = await Hashtag.findOne({ where: { title : req.params.title}}); // 파라미터의 타이틀 하나만 찾는다
        if (!hashtag) {
            // console.log(posts);
            return res.status(404).json({
                code: 404,
                message : '검색 결과가 없습니다'
            });
        }
        const posts = await hashtag.getPosts();
        return res.json({
            code : 200,
            payload : posts,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            code : 500,
            message : '서버 에러',
        });
    }
});


module.exports = router;