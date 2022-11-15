const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const nunjucks = require('nunjucks');
const dotenv = require('dotenv');
const passport = require('passport');
const v1 = require('./routes/v1');
const v2 = require('./routes/v2');


dotenv.config();
const authRouter = require('./routes/auth');

const indexRouter = require('./routes/index');
const {sequelize} = require('./models');
const passportConfig = require('./passport');

const app = express();
passportConfig(); //패스포트 설정

app.set('port', process.env.PORT || 8002);
app.set('view engine', 'html');
nunjucks.configure('views', {
    express: app,
    watch: true,
});

sequelize.sync({force: false})
    .then( () => {
        console.log('데이터베이스 연결 성공');
    })
    .catch((err) => {
        console.error(err);
    });


app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/img', express.static(path.join(__dirname, 'uploads'))); // 이거 추가해줘야 이미지가 뜸 !!!
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
        httpOnly: true,
        secure: false,
    },
}));

app.use(passport.initialize());  // 요청 객체에 passport 설정을 심음
app.use(passport.session());  // req.session 객체에 passport 정보를 저장
// express-session 미들웨어에 의존하므로 이보다 더 뒤에 위치해야함

app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/v1', v1);
app.use('/v2', v2);





app.use((req, res, next) => {
    const error =  new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
    error.status = 404;
    next(error);
});

app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});

app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기중');
});