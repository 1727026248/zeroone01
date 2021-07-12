/* 
14 10 * * * https://raw.githubusercontent.com/smiek2221/scripts/master/jd_sign_graphics.js
只支持nodejs环境
需要安装依赖 
npm i png-js 或者 npm i png-js -S

*/

const validator = require('./shufflewzc_faker2_jd_JDJRValidator_Pure.js');
const Faker=require('./shufflewzc_faker2_jd_sign_graphics_validate.js') 

const $ = new Env('京东签到图形验证');
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let cookiesArr = [], cookie = '';
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => { };
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jsonParse($.getdata('CookiesJD') || "[]").map(item => item.cookie)].filter(item => !!item);
}
let message = '', subTitle = '', beanNum = 0;
let fp = ''
let eid = ''
let UA = ""
let signFlag = false
let successNum = 0
let errorNum = 0

const turnTableId = [
  { "name": "京东商城-内衣", "id": 1071, "url": "https://prodev.m.jd.com/mall/active/4PgpL1xqPSW1sVXCJ3xopDbB1f69/index.html" },
  { "name": "京东商城-健康", "id": 527, "url": "https://prodev.m.jd.com/mall/active/w2oeK5yLdHqHvwef7SMMy4PL8LF/index.html" },
  { "name": "京东商城-清洁", "id": 446, "url": "https://prodev.m.jd.com/mall/active/2Tjm6ay1ZbZ3v7UbriTj6kHy9dn6/index.html" },
  { "name": "京东商城-个护", "id": 336, "url": "https://prodev.m.jd.com/mall/active/2tZssTgnQsiUqhmg5ooLSHY9XSeN/index.html" },
  { "name": "京东商城-童装", "id": 511, "url": "https://prodev.m.jd.com/mall/active/3Af6mZNcf5m795T8dtDVfDwWVNhJ/index.html" },
  { "name": "京东商城-母婴", "id": 458, "url": "https://prodev.m.jd.com/mall/active/3BbAVGQPDd6vTyHYjmAutXrKAos6/index.html" },
  { "name": "京东商城-数码", "id": 347, "url": "https://prodev.m.jd.com/mall/active/4SWjnZSCTHPYjE5T7j35rxxuMTb6/index.html" },
  { "name": "京东超市", "id": 1204, "url": "https://pro.m.jd.com/mall/active/QPwDgLSops2bcsYqQ57hENGrjgj/index.html" },
]
$.get = validator.injectToRequest($.get.bind($), 'channelSign')
$.post = validator.injectToRequest($.post.bind($), 'channelSign')

!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { "open-url": "https://bean.m.jd.com/bean/signIndex.action" });
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1])
      $.index = i + 1;
      $.nickName = '';
      console.log(`\n开始【京东账号${$.index}】${$.nickName || $.UserName}\n`);
      beanNum = 0
      successNum = 0
      errorNum = 0
      subTitle = '';
      await signRun()
      const UTC8 = new Date().getTime() + new Date().getTimezoneOffset()*60000 + 28800000;
      $.beanSignTime = new Date(UTC8).toLocaleString('zh', {hour12: false});
      let msg = `【京东账号${$.index}】${$.nickName || $.UserName}\n【签到时间】:  ${$.beanSignTime}\n【签到概览】:  成功${successNum}个, 失败${errorNum}个\n【签到奖励】:  ${beanNum}京豆\n`
      message += msg + '\n'
      $.msg($.name, msg);
      // break
    }
  }
  await showMsg();
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
  })
  .finally(() => {
    $.done();
  })

async function showMsg() {
  $.msg($.name, `【签到数量】:  ${turnTableId.length}个\n` + subTitle + message);
  if ($.isNode() && message) await notify.sendNotify(`${$.name}`, `【签到数量】:  ${turnTableId.length}个\n` + subTitle + message);
}
async function signRun() {
  UA = $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1")
  for (let i in turnTableId) {
    signFlag = false
    await Login(i)
    if(signFlag){
      successNum++;
    }else{
      errorNum++;
    }
  }
}

function Sign(i) {
  return new Promise(resolve => {
    $.post(tasPostkUrl(turnTableId[i].id), (err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${turnTableId[i].name} 签到: API查询请求失败 ‼️‼️`)
          throw new Error(err);
        } else {
          if (data) {
            // console.log(data)
            data = JSON.parse(data);
            if (data.success && data.data) {
              data = data.data
              if (Number(data.jdBeanQuantity) > 0) beanNum += Number(data.jdBeanQuantity)
              signFlag = true;
              console.log(`${turnTableId[i].name} 签到成功:获得 ${Number(data.jdBeanQuantity)}京豆`)
            } else {
              if (data.errorMessage) {
                if(data.errorMessage.indexOf('已签到') > -1 || data.errorMessage.indexOf('今天已经签到') > -1){
                  signFlag = true;
                }
                console.log(`${turnTableId[i].name} ${data.errorMessage}`)
              } else {
                console.log(`${turnTableId[i].name} ${JSON.stringify(data)}`)
              }
            }
          } else {
            console.log(`京豆api返回数据为空，请检查自身原因`)
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}
function Login(i) {
  return new Promise(resolve => {
    $.get(taskUrl(turnTableId[i].id), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${turnTableId[i].name} 登录: API查询请求失败 ‼️‼️`)
          throw new Error(err);
        } else {
          if (data) {
            // console.log(data)
            data = JSON.parse(data);
            if (data.success && data.data) {
              data = data.data
              if (!data.hasSign) {
                let arr = await Faker.getBody(UA,turnTableId[i].url)
                fp = arr.fp
                await getEid(arr)
                await Sign(i)
              } else {
                if(data.records && data.records[0]){
                  for(let i in data.records){
                    let item = data.records[i]
                    if((item.hasSign == false && item.index != 1) || i == data.records.length-1){
                      if(item.hasSign == false) i = i-1
                      beanNum += Number(data.records[i].beanQuantity)
                      break;
                    }
                  }
                }
                signFlag = true;
                console.log(`${turnTableId[i].name} 已签到`)
              }
            } else {
              if (data.errorMessage) {
                if(data.errorMessage.indexOf('已签到') > -1 || data.errorMessage.indexOf('今天已经签到') > -1){
                  signFlag = true;
                }
                console.log(`${turnTableId[i].name} ${data.errorMessage}`)
              } else {
                console.log(`${turnTableId[i].name} ${JSON.stringify(data)}`)
              }
            }
          } else {
            console.log(`京豆api返回数据为空，请检查自身原因`)
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}

function getEid(arr) {
  return new Promise(resolve => {
    const options = {
      url: `https://gia.jd.com/fcf.html?a=${arr.a}`,
      body: `d=${arr.d}`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "User-Agent": UA
      }
    }
    $.post(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${turnTableId[i].name} 登录: API查询请求失败 ‼️‼️`)
          throw new Error(err);
        } else {
          if (data.indexOf("*_*") > 0) {
            data = data.split("*_*", 2);
            data = JSON.parse(data[1]);
            eid = data.eid
          } else {
            console.log(`京豆api返回数据为空，请检查自身原因`)
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}

function taskUrl(turnTableId) {
  const url = `https://jdjoy.jd.com/api/turncard/channel/detail?turnTableId=${turnTableId}&invokeKey=NRp8OPxZMFXmGkaE`
  return {
    url,
    headers: {
      "Accept": "application/json, text/plain, */*",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "zh-cn",
      "Connection": "keep-alive",
      'Cookie': cookie,
      "Origin": "https://prodev.m.jd.com",
      "Referer": "https://prodev.m.jd.com/",
      "User-Agent": UA,
    }
  }
}

function tasPostkUrl(turnTableId) {
  const url = `https://jdjoy.jd.com/api/turncard/channel/sign?turnTableId=${turnTableId}&fp=${fp}&eid=${eid}&invokeKey=NRp8OPxZMFXmGkaE`
  return {
    url,
    headers: {
      "Accept": "application/json, text/plain, */*",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      "Connection": "keep-alive",
      "Content-Type": "application/x-www-form-urlencoded",
      'Cookie': cookie,
      "Origin": "https://prodev.m.jd.com",
      "Referer": "https://prodev.m.jd.com/",
      "User-Agent": UA,
    }
  }
}



function Env(t,e){"undefined"!=typeof process&&JSON.stringify(process.env).indexOf("GITHUB")>-1&&process.exit(0);class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toOb
