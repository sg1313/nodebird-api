const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const url = require('url');

const { verifyToken, apiLimiter } = require('./middlewares');
const { Domain, User, Post, Hashtag, Guestbook } = require('../models');
const {hash} = require("bcrypt");

const router = express.Router();

// 모든 도메인 허용하게 해줌
// router.use(cors({
//     credentials: true,
// }));

// 지정된 도메인만 들어오게 해줌 (db에 등록된 도메인!!)
router.use(async (req, res, next) => {
    const domain = await Domain.findOne({
        where: { host : url.parse(req.get('origin')).host},
    });  // 주소가 localhost:4000번인 도메인을 찾는 쿼리 select * from domains where host = 'localhost:4000'/
    if (domain) {
        cors({
            origin : req.get('origin'), // origin은 접속한 사람의 주소
            credentials : true,
        }) (req, res, next);
    } else {
        next();
    }
});


router.post('/token', apiLimiter, async (req, res) => {
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
            expiresIn: '30m', // 1분
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
router.get('/test', verifyToken, apiLimiter, (req, res) => {
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
router.get('/posts/hashtag/:title', verifyToken, apiLimiter, async (req, res) => {
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

router.get('/guestbook/my', verifyToken, apiLimiter, (req, res) => {
    Guestbook.findAll()   // post를 guestbook으로 바꿔줘야함,,
        .then((posts) => {    // 위에있는 post 그대로 복붙해서 갖고왔는데 guestbook에는 where조건이 없기 때문에 자꾸 읽을수가 없었다
            res.json({  // json 형식으로 응답하기
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
// 프론트단에도 연결해주자 (nodecat의 라우터/index에 !)


// 방명록 삭제 api
router.get('/guestbooks/delete/:id', verifyToken, (req, res) => {
    try {
        Guestbook.destroy({where: {id: req.params.id}})
            .then((posts) => {
                res.json({
                    code: 200,
                    payload: posts,
                });
            })
    } catch (error) {
                console.error(error);
                return res.status(500).json({
                    code: 500,
                    message : '서버 에러',
                });
            }
});


// 방명록 수정 api ㄴ
router.get('/guestbooks/update/:id', verifyToken, (req, res) => {
    Guestbook.findOne({where: {id: req.params.id}})  // findAll 이 아니라 findOne 으로 수정해줘야함
        .then((posts) => {
            res.json({
                code : 200,
                payload : posts,
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





// 방명록 등록하기
router.post('/guestbooks/create', verifyToken, async (req, res) => {
    // const {name, email, content) = req.body;
    console.log("444444444->", req.body);
    try {  // 등록한 방명록 데이터 guestbooks 테이블에 넣기 !!
        const guestbook = await Guestbook.create({
            'nick': req.body.data.name,
            'email': req.body.data.email,
            'content': req.body.data.content,
        });

        res.json({
            code: 200,
            payload: "444444444",
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: '서버 에러'
        })
    }
})


router.post('/guestbooks/update', verifyToken, async (req, res) => {
    // const {name, email, content) = req.body;
    try {  // 등록한 방명록 데이터 guestbooks 테이블에 넣기 !!
        const guestbook = await Guestbook.update({
            'nick': req.body.data.name,
            'email': req.body.data.email,
            'content': req.body.data.content,
        },{
            where : { id : req.body.data.id}}
        );
        res.json({
            code: 200,
            payload: "수정완료",
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: '서버 에러'
        })
    }
})




module.exports = router;