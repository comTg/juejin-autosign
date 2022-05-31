const config = require('./config')
const { getCookie } = require('./lib/cookie')
const JuejinHttp = require('./lib/api')
const email = require('./lib/email')
config.user.password = process.argv[2] // 第三个参数是用户密码
config.email.provider.auth.pass = process.argv[3] // 邮箱授权码

const signIn = async () => {
    const cookie = await getCookie()
    if (!cookie) {
        console.log(`获取cookie失败`)
        await email.send({
            to: config.user.email,
            text: `用户【${config.user.mobile}】签到失败  [获取cookie失败]`,
            subject: `【掘金】签到失败！`
        })
        return
    }

    try {
        const API = new JuejinHttp(cookie)
        const isCheckIn = await API.queryTodayStatus()
        let lotteryName = ''
        if (isCheckIn) {
            console.log(`今日已签到`)
            return
        } else {
            await API.handleCheckIn()
            console.log(`签到成功`)
        }
        const { free_count } = await API.queryLotteryConfig()
        if (!free_count) {
            console.log(`今日已免费抽奖`)
        } else {
            const { lotteries } = await API.queryLuckyList()
            const luckyId = lotteries && lotteries[0] ? lotteries[0]['history_id'] : 0
            const { has_dip, dip_action, total_value } = await API.handleDipLucky(luckyId)
            if (has_dip) {
                console.log(`今日已沾过喜气`)
            }
            if (dip_action === 1) {
                console.log(`沾喜气成功`)
            }
            console.log(`当前喜气值：${total_value}`)
            const { lottery_name } = await API.handleLotteryDraw()
            lotteryName = lottery_name
            console.log(`抽奖成功：${lotteryName}`)
        }
        const totalPoint = await API.queryTotalPoint()
        console.log(`当前矿石：${totalPoint}`)
        console.log(`签到成功`)
        const lotteryText = lotteryName ? `，获得[${lotteryName}]` : ''
        await email.send({
            to: config.user.email,
            text: `用户【${config.user.mobile}】签到成功 ${lotteryText}，当前矿石：${totalPoint}`,
            subject: `【掘金】签到提醒`
        })

    } catch (err) {
        console.log(`签到失败`, err)
        await email.send({
            to: config.user.email,
            text: `用户【${config.user.mobile}】签到失败  [${err.message || 'error'}]`,
            subject: `【掘金】签到失败！`
        })
    }
}
signIn()

module.exports = {
    signIn
}