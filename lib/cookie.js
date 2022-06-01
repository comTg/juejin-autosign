const fs = require('fs')
const path = require('path')
const config = require('../config')
const calcGapPosition = require('./gap')
const puppeteer = require('puppeteer')

//格式化 cooKie
const formatCookie = cookies => {
    const cookieItems = [];
    for (let item of cookies) {
        cookieItems.push(item.name + '=' + item.value)
    }
    return cookieItems.join(';')
}

// 读取cookie
const readCookie = () => {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, "../cookie.txt"), 'utf-8', function (error, data) {
            if (error) {
                return resolve([error, null])
            }
            let arr = data.split('|')
            if (arr.length < 2) return resolve([null, null])
            let t = arr[0]
            let cookie = arr[1]

            if (Date.now() >= t + config.juejin.keep * 24 * 60 * 60 * 1000) {
                return resolve([null, null]) // 过期cookie 
            }

            return resolve([null, cookie])
        })
    })
}

//保存 cookie
const setCookie = cookie => {
    const timestamp = Date.now()
    const str = `${timestamp}|${cookie}`
    return new Promise(async (resolve) => {
        fs.writeFile(path.join(__dirname, "../cookie.txt"), str, function (err) {
            if (err) {
                return resolve([err, null])
            }
            return resolve([null, err])
        })
    })
}


const getCookie = async () => {
    if (config.juejin.keep !== false) {
        const [cookieErr, oldCookie] = await readCookie()
        if (oldCookie) return oldCookie
    }
    const browser = await puppeteer.launch({
        headless: true,
        ignoreDefaultArgs: ['--disable-extensions'],
        args: [
            '--no-sandbox', '--disable-setuid-sandbox',
            '--use-gl=egl',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
        ]
    });

    try {
        const page = await browser.newPage()
        await page.goto(config.juejin.login)
        await page.waitForTimeout(1000)
        await page.waitForSelector(".clickable")
        await page.click(".clickable")
        await page.waitForTimeout(1000)
        await page.waitForSelector('input[name=loginPhoneOrEmail]')
        await page.type('input[name=loginPhoneOrEmail]', config.user.mobile, { delay: 50 })
        await page.type('input[name=loginPassword]', config.user.password, { delay: 50 })
        await page.waitForTimeout(1000)
        await page.click('.btn')
        await page.waitForSelector('#captcha-verify-image')
        await page.waitForTimeout(1000)
        let slideNum = 10 //最多尝试10次滑块验证
        let slideStatus = false
        let loginStatus = false
        while (slideNum > 0 && slideStatus == false) {
            console.log(`开始第${10 - slideNum + 1}次验证`)
            const imageSrc = await page.$eval('#captcha-verify-image', el => el.src)
            const distance = await calcGapPosition(page, imageSrc)
            await page.hover('.secsdk-captcha-drag-icon')
            let ele = await page.$('.secsdk-captcha-drag-icon')
            let gapEle = await page.$('.captcha_verify_img_slide')
            let gapBlock = await gapEle.boundingBox()
            let block = await ele.boundingBox()
            await page.mouse.down()
            await page.mouse.move(gapBlock.x + distance + gapBlock.width - block.width / 2 - 5, block.y + (block.y / 2), { steps: 50 })
            await page.mouse.up()
            let verifyRes = await page.waitForResponse(response => response.url().includes(config.juejin.verifyApi) && response.status() === 200)
            let jsonRes = await verifyRes.json()
            if (jsonRes.code == 200) {
                // 验证通过
                slideStatus = true
                console.log('登录中...')
                let loginRes = await page.waitForResponse(response => response.url().includes(config.juejin.loginApi) && response.status() === 200)
                try {
                    jsonRes = await loginRes.json()
                    if (jsonRes.message && jsonRes.message == 'error') {
                        console.log(`登录失败`, jsonRes)
                    } else {
                        loginStatus = true
                    }
                } catch (err) {
                    loginStatus = true
                }
            } else {
                await page.waitForTimeout(5 * 1000);
                await page.$('.secsdk_captcha_refresh--text')
            }
            slideNum--;
        }
        if (!loginStatus) {
            await browser.close()
            return false
        }
        console.log(`登录成功`)
        await page.waitFor(2 * 1000)
        const cookie = await page.cookies();
        const cookieStr = formatCookie(cookie)
        await browser.close()
        await setCookie(cookieStr)
        console.log(`获取cookie成功`)
        return cookieStr
    } catch (err) {
        await browser.close()
        console.log(`获取cookie失败`)
        console.log(err)
        return ''
    }
}


module.exports = {
    getCookie
}