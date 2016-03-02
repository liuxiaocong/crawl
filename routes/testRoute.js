var express = require('express');
var router = express.Router();
var extend = require('util')._extend;
var jsdom = require('jsdom');
var request = require('request');
var fs = require("fs");
var sizeOf = require('image-size');
var cheerio = require('cheerio');
var urll = require('url');
var http = require('http');
var gm = require('gm');
var path = require('path');
var images = require("images");
/* GET users listing. */
//router.get('/', function(req, res) {
//  res.send('respond with a resource');
//});
var phantom = require('phantom');
var mdbService = require("../service/mdbService");
var utilsService = require("../service/utilsService");
router.get('/crawlPkGame', function (req, res) {
    request({uri: "http://webapi.pkh5.moranger.com/tzxv86.php?filter=100"}, function (err, response, body) {
        var self = this;
        self.items = new Array();//I feel like I want to save my results in an array

        //Just a basic error check
        if (err && response.statusCode !== 200) {
            console.log('Request error.');
        }
        //Send the body param as the HTML code we will parse in jsdom
        //also tell jsdom to attach jQuery in the scripts and loaded from jQuery.com

        var $ = cheerio.load(body);
        var ary = $("a");
        for (var i = 0; i < ary.length; i++) {
            if (ary[i].attribs.href.indexOf(".zip") > 0) {
                var id = ary[i].attribs.href.substr(ary[i].attribs.href.indexOf("_h5") + 4, 8);
                console.log(id);
                console.log(ary[i].attribs.href);
                var filedir = "D:\\xampp\\htdocs\\games\\";
                var filepath = filedir + id + ".zip";
                request(ary[i].attribs.href).pipe(fs.createWriteStream(filepath));
            }
            ;
        }
    })
});

router.get('/', function (req, res) {
    phantom.create(function (ph) {
        ph.createPage(function (page) {
            page.open("http://www.google.com", function (status) {
                console.log("opened hot top py ", status);
                page.evaluate(function () {
                    return document.title;
                }, function (result) {
                    console.log('Page title is ' + result);
                    ph.exit();
                });
            });
        });
    });
});

router.get('/genNews', function (req, res) {
    var url = "http://172.28.2.70:8080/crawl.instamob.im/crawl/newstpl.html";
    var data = {};
    request({uri: url}, function (err, response, body) {
        var self = this;
        self.items = new Array();//I feel like I want to save my results in an array

        //Just a basic error check
        if (err && response.statusCode !== 200) {
            console.log('Request error.');
        }
        //Send the body param as the HTML code we will parse in jsdom
        //also tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
        var $ = cheerio.load(body);
        var imgs = $("img");
        var title = $("title").text();
        var div = $("div");
        div.each(function(){
            console.log($(this));
        })

        res.end("end");
        return;
        var content = $("p").parent();
        //filter img tab
        content = content.html().replace(/<img.*>.*<\/img>/ig, "");
        content = content.replace(/<img.*\/>/ig, "");
        content = content.replace(/<img.*>/ig, "");
        content = content.replace(/<!--.*-->/ig, "");//filter explanatory
        console.log(content);
//        console.log(imgs);
//        console.log(title);
        data.title = title;
        data.img = imgs[2].attribs.src;
        data.content = content;
        var options = urll.parse(data.img);
//        request({uri: data.img}, function (err, response, body) {
        http.get(options, function (response) {
            console.log("statusCode: ", response.statusCode);
            var chunks = [];
            response.on('data',function (chunk) {
                chunks.push(chunk);
            }).on('end', function () {
                    var buffer = Buffer.concat(chunks);
                    console.log(sizeOf(buffer));
                    res.end(JSON.stringify(data));
                });
        });
//        });
//            console.log(content);
//            console.log(avatar);
        //news.content = content;
    });
});

router.get('/genPhoto', function (req, res) {
//    images("D:\\xampp\\htdocs\\crawl.instamob.im\\crawl-n\\public\\news\\ddd.png")
//        .size(2000)
//        .save("D:\\xampp\\htdocs\\crawl.instamob.im\\crawl-n\\public\\news\\ddd2.png",{
//            quality : 100
//        });
    //D:\\xampp\\htdocs\\crawl.instamob.im\\crawl-n\\public\\news\\82_27.png
    //D:\\xampp\\htdocs\\crawl.instamob.im\\crawl-n\\public\\news\\600_1822.jpg
    //D:\\xampp\\htdocs\\crawl.instamob.im\\crawl-n\\public\\news\\1024_249.jpg
    //D:\\xampp\\htdocs\\crawl.instamob.im\\crawl-n\\public\\news\\1920_760.jpg
    //D:\\xampp\\htdocs\\crawl.instamob.im\\crawl-n\\public\\news\\1920x1200.jpg
    //D:\\xampp\\htdocs\\crawl.instamob.im\\crawl-n\\public\\news\\bg.jpg
//    images(images("D:\\xampp\\htdocs\\crawl.instamob.im\\crawl-n\\public\\news\\ddd.png").size(2000,2000), 0, 0, 500, 500)
//    .save("D:\\xampp\\htdocs\\crawl.instamob.im\\crawl-n\\public\\news\\ddd3.png",{
//        quality : 80
//    });
    var url = "http://cdn.dfile.cn/v/1408420458/i1/m/images/dict_m_appiocn_wysdccd.png";
    var ext = path.extname(url);
    ext = ext ? ext.slice(1) : 'unknown';
    var type = utilsService.getType(ext);
    console.log(type);
    url = req.query.url;
    console.log(url);
    if (url.indexOf("http:") >= 0) {
        utilsService.genNewImage(url, 1, 500, 900, true, function (imageName, date) {
            var imageUrl = utilsService.selfUrl + "genimages/" + date + "/" + "1" + "/" + imageName;
            var localtion = utilsService.genImageLocation +  date + utilsService.fileBreaker + "1" + utilsService.fileBreaker + imageName;
            console.log(localtion);
//            res.end(imageUrl);
            fs.readFile(localtion, "binary", function (err, file) {
                if (err) {
                    res.writeHead(500, {
                        'Content-Type': 'text/plain'
                    });
                    console.log(err);
                    res.end("err");
                } else {
                    res.writeHead(200, {
                        'Content-Type': type
                    });
                    res.write(file, "binary");
                    res.end();
                }
            });
        })
    } else {
        res.end("no url");
    }
});
module.exports = router;
