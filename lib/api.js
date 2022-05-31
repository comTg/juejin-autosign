const axios = require('axios')
const assignOption = (ops1, ops2) => {
    let ops = Object.assign({}, ops1, ops2)
    let keys = Object.keys(ops1)
    keys.forEach((item) => {
        if (typeof ops1[item] === 'object' && !Array.isArray(ops1[item])) {
            ops[item] = Object.assign({}, ops1[item], ops2[item] || {})
        }
    })
    return ops
}
const defaultOptions = {
    method: 'GET',
    data: {},
    params: {},
    headers: {
        origin: 'https://juejin.cn',
        pragma: 'no-cache',
        referer: 'https://juejin.cn/',
        'sec-ch-ua':
            '"Chromium";v="92", " Not A;Brand";v="99", "Google Chrome";v="92"',
        'sec-ch-ua-mobile': '?0',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36',
    },
}

class JuejinHttp {
    constructor(cookie) {
        this.cookie = cookie || ''
    }
    request(options) {
        return new Promise((resolve, reject) => {
            options = Object.assign({}, options, {
                headers: {
                    cookie: this.cookie || ''
                }
            })
            const opts = assignOption(defaultOptions, options)
            axios(opts)
                .then((res) => {
                    let data = res.data || {}
                    if (data.err_no === 0) {
                        resolve(data.data)
                    } else {
                        reject(data)
                    }
                })
                .catch((err) => {
                    reject(err)
                })
        })
    }
    // 获取今日状态
    queryTodayStatus() {
        return this.request({
            method: 'GET',
            url: 'https://api.juejin.cn/growth_api/v1/get_today_status'
        })
    }
    // 今日签到
    handleCheckIn() {
        return this.request({
            method: 'POST',
            url: 'https://api.juejin.cn/growth_api/v1/check_in',
        })
    }
    // 开始抽奖
    handleLotteryDraw() {
        return this.request({
            method: 'POST',
            url: 'https://api.juejin.cn/growth_api/v1/lottery/draw'
        })
    }
    // 查询总矿石
    queryTotalPoint() {
        return this.request({
            method: 'GET',
            url: 'https://api.juejin.cn/growth_api/v1/get_cur_point'
        })
    }
    // 查询是否有免费抽奖次数
    queryLotteryConfig() {
        return this.request({
            method: 'GET',
            url: 'https://api.juejin.cn/growth_api/v1/lottery_config/get'
        })
    }
    // 获取沾喜气列表
    queryLuckyList() {
        return this.request({
            method: 'POST',
            url: 'https://api.juejin.cn/growth_api/v1/lottery_history/global_big',
            data: { page_no: 1, page_size: 5 }
        })
    }
    // 沾喜气  id
    handleDipLucky(id) {
        return this.request({
            method: 'POST',
            url: 'https://api.juejin.cn/growth_api/v1/lottery_lucky/dip_lucky',
            data: { lottery_history_id: id }
        })
    }
}

module.exports = JuejinHttp