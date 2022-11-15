const passport = require('passport');
const KakaoStrategy = require('passport-kakao').Strategy;

const User = require('../models/user');

module.exports = () => {
    passport.use(new KakaoStrategy({
        clientID: process.env.KAKAO_ID,
        callbackURL: '/auth/kakao/callback', // callbackURL : 카카오 로그인 후 카카오가 결과를 전송해줄 URL
    }, async (accessToken, refreshToken, profile, done) => { // 로그인 성공 후 카카오가 보내준 토큰(사용하지 않음)
        console.log('kakao profile', profile);              // profile : 카카오가 보내준 유저 정보. profile 바탕으로 회원가입
        try {
            const exUser = await User.findOne({
                where: { snsId: profile.id, provider: 'kakao' },
            });
            if (exUser) {
                done(null, exUser);
            } else {
                const newUser = await User.create({   // 회원가입
                    email: profile._json && profile._json.kakao_account_email,
                    nick: profile.displayName,
                    snsId: profile.id,
                    provider: 'kakao',
                });
                done(null, newUser);
            }
        } catch (error) {
            console.error(error);
            done(error);
        }
    }));
};