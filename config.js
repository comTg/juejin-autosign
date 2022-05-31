module.exports = {
    // 这里的邮箱配置以网易邮箱为例，qq邮箱端口和host等均会有差异 具体可以留言提问或百度
    email: {
        provider: {
            auth: {
                user: 'ch1njiaqing@163.com', // 你的网易邮箱账号
                pass: '',  // 你的网易邮箱 smpt 授权码
            },
            host: 'smtp.163.com',
            secure: true,
            port: 465,
            secureConnection: true
        }
    },
    juejin: {
        login: 'https://juejin.cn/login',
        loginApi: '/passport/web/user/login',
        verifyApi: 'verify.snssdk.com/captcha/verify',
        keep: 20, // cookie保存天数，默认20   为false则每次签到都需要登录获取cookie
    },
    user: {
        mobile: "18584820853", //你的掘金登录手机号
        password: '', // 你的掘金登录密码
        email: "1143810120@qq.com", // 你的接收通知的邮箱
    }
}