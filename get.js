"use strict"

const http = require('http')
const fs = require('fs')
const cheerio = require('cheerio')
const request = require('request')

let url = 'http://www.mmjpg.com/mm/1374' // 入口链接
let count = 0 // 记录扒取的图片数量
let imgDirName = '' // 图片存放的目录
let limit = 100 // 用来限制扒取图片数量

function start(url) { // 以下内容会执行多次，我们将其封装成一个函数
  // 利用http模块发起依次get请求
  http.get(url, (res) => {
    let html = '' // 存放当前页面的html代码
    res.setEncoding('utf-8') // 设置编码

    // 接受到数据时，将收到的数据拼接到上面定义的html变量中，接收完成后即得到该页完整的html代码
    res.on('data', (data) => {
      html += data
    })

    // 当数据接收完成（html拼接完成）之后...
    res.on('end', (err) => {
      if (err) {
        console.log(err)
      } else {
        const $ = cheerio.load(html) // 利用cheerio模块将完整的html装载到变量$中，之后就可以像jQuery一样操作html了

        // 获取图片的地址和名称
        let imgSrc = $('#content img').attr('src')
        let imgName = $('#content img').attr('alt')

        console.log(imgSrc)
        //console.log(imgName)

        /*
         * 利用图片名称获取当前图片应该应该存放的目录
         * 我们扒取的图片名称的格式为：第一张：‘xxxx’，第二张：‘xxxx 第二张’，第三张：‘xxxx 第三张’ ... 
         * 我们取xxxx作为图片存放的目录名，只有当每一组扒取完毕后，切换到下一组时xxxx才会发生改变
         * 判断如果目录名发生改变后，创建一个新目录并使用新目录存放接下来的图片
         */
        let dirName = /\s/g.test(imgName) ? imgName.split(' ')[0] : imgName
        if (imgDirName !== dirName) {
          fs.mkdir('./img/' + dirName + '/', (err) => {
            if (err) {
              console.log(err)
            }
          })
          imgDirName = dirName
        }

        // 利用request模块保存图片
        var options = {
          //url: "http://www.mmjpg.com",
          url: imgSrc,
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
            'Referer': "http://www.mmjpg.com"
          }
        };

        request(options, function (error, response, body) {})
          .pipe(fs.createWriteStream('./img/' + imgDirName + '/' + imgName + '.jpg'));

        count++
        console.log('已爬取图片' + count + '张')

        //  获取下一页图片的链接，如果下一页存在，继续扒！
        let nextLink = 'http://www.mmjpg.com' + $('.next').attr('href')
        if (nextLink && (count <= limit)) {
          start(nextLink)
        }
      }
    })
  })
}
start(url)
