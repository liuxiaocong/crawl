/**
 * Created with JetBrains PhpStorm.
 * User: Administrator
 * Date: 1/5/15
 * Time: 1:37 PM
 * To change this template use File | Settings | File Templates.
 */
var http = require("http");
var fs = require("fs");
var imagesGen = require("images");
var urlModule = require('url');
var https = require('https');
var request = require('request');
var utils = (function () {
    var types = {
        "css": "text/css",
        "gif": "image/gif",
        "html": "text/html",
        "ico": "image/x-icon",
        "jpeg": "image/jpeg",
        "jpg": "image/jpeg",
        "js": "text/javascript",
        "json": "application/json",
        "pdf": "application/pdf",
        "png": "image/png",
        "svg": "image/svg+xml",
        "swf": "application/x-shockwave-flash",
        "tiff": "image/tiff",
        "txt": "text/plain",
        "wav": "audio/x-wav",
        "wma": "audio/x-ms-wma",
        "wmv": "video/x-ms-wmv",
        "xml": "text/xml"
    };
    var utilsObj = {};
    var path = fs.realpathSync('.');
    var env = "win";
    utilsObj.fileBreaker = "\\";
    utilsObj.newsLocation = "D:\\xampp\\htdocs\\crawl.instamob.im\\crawl-n\\public\\news\\";
    utilsObj.genImageLocation = "D:\\xampp\\htdocs\\crawl.instamob.im\\crawl-n\\public\\genimages\\";
    utilsObj.genImageBGLocation = "D:\\xampp\\htdocs\\crawl.instamob.im\\crawl-n\\public\\genimages\\bg.jpg";
    utilsObj.mode = "local";
    utilsObj.selfUrl = "/";
    utilsObj.serverApi = "http://192.168.128.100:56382";
    if (!(path.indexOf("\\") > 0)) {
        env = "unix";
        utilsObj.fileBreaker = "/";
    }
    console.log(env);
    if (fs.existsSync(path + utilsObj.fileBreaker + ".local")) {
        utilsObj.newsLocation = "D:\\node-work\\\crawl\\public\\news\\";
        utilsObj.mode = "local";
        console.log("local");
    } else if (fs.existsSync(path + utilsObj.fileBreaker + ".dev")) {
//      utilsObj.newsLocation = "/var/www/crawl.instamob.im/crawl-n/public/news/";
//      utilsObj.genImageLocation = "/var/www/crawl.instamob.im/crawl-n/public/genimages/";
//      utilsObj.genImageBGLocation = "/var/www/crawl.instamob.im/crawl-n/public/genimages/bg.jpg";
//      utilsObj.mode = "dev";
//      utilsObj.selfUrl = "http://xc.128dev.mozat.com/";
//      console.log("dev");
        utilsObj.newsLocation = "/home/ubuntu/node-work/crawl/public/news/";
        utilsObj.genImageLocation = "/home/ubuntu/node-work/crawl/public/genimages/";
        utilsObj.genImageBGLocation = "/home/ubuntu/node-work/crawl/public/res/bg.jpg";
        utilsObj.mode = "dev";
        utilsObj.selfUrl = "http://54.254.138.49:9025/";
        console.log("dev");
    } else {
        utilsObj.newsLocation = "/var/www/crawl.instamob.im/crawl-n/public/news/";
        utilsObj.genImageLocation = "/var/www/crawl.instamob.im/crawl-n/public/genimages/";
        utilsObj.genImageBGLocation = "/var/www/crawl.instamob.im/crawl-n/public/genimages/bg.jpg";
        utilsObj.mode = "pro";
        utilsObj.selfUrl = "http://crawl.instamob.im/";
        utilsObj.serverApi = "http://10.160.241.149:56382";
        console.log("pro");
    }
    utilsObj.name = "utils service";


    utilsObj.processRes = function (res) {
        res.finishCrawl += 1;
        if (res.finishCrawl == res.sourceAccount) {
            res.render('instamob/index');
        }
    }
    utilsObj.getUtcTimeStamp = function () {
        var now = new Date;
        var utc_timestamp = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
            now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());
        return utc_timestamp;
    }
    utilsObj.downloadImage = function (url, location, cb) {
        var httpObj = http;
        if (url.indexOf("https://") >= 0) {
            httpObj = https;
        }
        httpObj.get(url, function (res) {
            var imgData = "";
            res.setEncoding("binary"); //一定要设置response的编码为binary否则会下载下来的图片打不开
            res.on("data", function (chunk) {
                imgData += chunk;
            });
            res.on("end", function () {
                console.log(location);
                fs.writeFile(location, imgData, "binary", function (err) {
//                    utilsObj.resizeImage(location, 900, 500, true, cb);
//                    console.log(err);
                    cb();
                });
            });
        });
    }
    utilsObj.saveHtml = function (content, location, cb) {
        fs.writeFile(location, content, function (err) {
            console.log(err);
            cb();
        });
    }
    utilsObj.saveFile = function (content, location, cb) {
        fs.writeFile(location, content, function (err) {
            console.log(err);
            cb();
        });
    }
    utilsObj.getNewsContent = function (id, cb) {
        var location = utilsObj.newsLocation + id + utilsObj.fileBreaker + "index.html";
//        console.log(location);
        fs.readFile(location, 'utf-8', function (err, data) {
//            console.log(data);
            if (err) {
                console.log(err);
            }
            cb(data);
        });
    }
    utilsObj.getNewsContentSync = function (id) {
        var location = utilsObj.newsLocation + id + utilsObj.fileBreaker + "index.html";
        var data = fs.readFileSync(location, 'utf-8');
        return data;
    }
    utilsObj.getComments = function (id) {
        return [];
    }



    utilsObj.filterHtmlTab = function (content) {
        content = content.replace(/"javascript(.+?)"/ig, "");
        content = content.replace(/'javascript(.+?)'/ig, "");
//        content = content.replace(/<img(.+?)>(.+?)<\/img>/ig, "");
//        content = content.replace(/<img(.+?)\/>/ig, "");
//        content = content.replace(/<img(.+?)>/ig, "");
        content = content.replace(/<!--(.+?)-->/ig, "");//filter explanatory
        content = content.replace(/<ul(.+?)>(.+?)<\/ul>/ig, "$2");
        content = content.replace(/<articl(.+?)>(.+?)<\/article>/ig, "<p>$2</p>");
        content = content.replace(/<a(.+?)>(.+?)<\/a>/ig, "<span>$2</span>");
        content = content.replace(/<li(.+?)>(.+?)<\/li>/ig, "<p>$2</p>");
        content = content.replace(/<iframe(.+?)>(.+?)<\/iframe>/ig, "");
        content = content.replace(/<object(.+?)>(.+?)<\/object>/ig, "");
        content = content.replace(/<script(.+?)>(.+?)<\/script>/ig, "");
        content = content.replace(/<style(.+?)>(.+?)<\/style>/ig, "");
        content = content.replace(/<link(.+?)>/ig, "");
        content = content.replace(/<iframe[\s\S]*?<\/iframe>/ig, "");
        content = content.replace(/<object[\s\S]*?<\/object>/ig, "");
        content = content.replace(/<script(.+?)>(.+?)<\/script>/ig, "");
        content = content.replace(/<noscript(.+?)>(.+?)<\/noscript>/ig, "");
        content = content.replace(/<style[\s\S]*?<\/style>/ig, "");
        content = content.replace(/<form[\s\S]*?<\/form>/ig, "");
        content = content.replace(/[\r\n\t]/g, "");
        content = content.replace(/<input(.+?)\/>/ig, "");
        content = content.replace(/<button(.+?)>(.+?)<\/button>/ig, "");
        content = content.replace(/<a(.+?)>/ig, "<span>");
        content = content.replace(/<\/a>/ig, "</span>");
        return content;
    }

    utilsObj.filterHtmlIncludeImg = function (content) {
        content = content.replace(/"javascript(.+?)"/ig, "");
        content = content.replace(/'javascript(.+?)'/ig, "");
        content = content.replace(/<img(.+?)>(.+?)<\/img>/ig, "");
        content = content.replace(/<img(.+?)\/>/ig, "");
        content = content.replace(/<img(.+?)>/ig, "");
        content = content.replace(/<!--(.+?)-->/ig, "");//filter explanatory
        content = content.replace(/<ul(.+?)>(.+?)<\/ul>/ig, "$2");
        content = content.replace(/<articl(.+?)>(.+?)<\/article>/ig, "<p>$2</p>");
        content = content.replace(/<a(.+?)>(.+?)<\/a>/ig, "<span>$2</span>");
        content = content.replace(/<li(.+?)>(.+?)<\/li>/ig, "<p>$2</p>");
        content = content.replace(/<iframe(.+?)>(.+?)<\/iframe>/ig, "");
        content = content.replace(/<object(.+?)>(.+?)<\/object>/ig, "");
        content = content.replace(/<script(.+?)>(.+?)<\/script>/ig, "");
        content = content.replace(/<style(.+?)>(.+?)<\/style>/ig, "");
        content = content.replace(/<link(.+?)>/ig, "");
        content = content.replace(/<iframe[\s\S]*?<\/iframe>/ig, "");
        content = content.replace(/<object[\s\S]*?<\/object>/ig, "");
        content = content.replace(/<script(.+?)>(.+?)<\/script>/ig, "");
        content = content.replace(/<noscript(.+?)>(.+?)<\/noscript>/ig, "");
        content = content.replace(/<style[\s\S]*?<\/style>/ig, "");
        content = content.replace(/<form[\s\S]*?<\/form>/ig, "");
        content = content.replace(/[\r\n\t]/g, "");
        content = content.replace(/<input(.+?)\/>/ig, "");
        content = content.replace(/<button(.+?)>(.+?)<\/button>/ig, "");
        content = content.replace(/<a(.+?)>/ig, "<span>");
        content = content.replace(/<\/a>/ig, "</span>");
        return content;
    }


    utilsObj.getImageNameFromUrl = function (url) {
        var iName = url.substr(url.lastIndexOf("/") + 1);
        if (iName.indexOf("?") > 0) {
            iName = iName.substr(0, iName.indexOf("?"));
        }
        return iName;
    }

    //in local file
    utilsObj.resizeImage = function (location, needWidth, needHeight, cut, cb) {
//        console.log(location);
        try {
            var img = imagesGen(location);
        } catch (e) {
            cb();
            return;
        }
        var height = img.height();
        var width = img.width();
        var targetHeight = img.height();
        var targetWidth = img.width();
        var targetLeft = 0;
        var targetTop = 0;
        //not cut
        if ((height / width) > (needHeight / needWidth)) {
            //vertical img
            if (cut) {
                targetWidth = needWidth;
                targetHeight = needWidth * height / width;
                targetTop = (targetHeight - needHeight) / 2;
            } else {
                targetHeight = needHeight;
                targetWidth = needHeight * width / height;
                targetLeft = (needWidth - targetWidth) / 2;
            }
        } else {
            //horizontal img
            if (cut) {
                targetHeight = needHeight;
                targetWidth = needHeight * width / height;
                targetLeft = (targetWidth - needWidth) / 2;
            } else {
                targetWidth = needWidth;
                targetHeight = needWidth * height / width;
                targetTop = (needHeight - targetHeight) / 2;
            }
        }
//        console.log("targetWidth:" + targetWidth);
//        console.log("targetHeight:" + targetHeight);
//        console.log("targetLeft:" + targetLeft);
//        console.log("targetTop:" + targetTop);
        if (cut) {
            console.log(utilsObj.genImageBGLocation);
            console.log(location);
            imagesGen(utilsObj.genImageBGLocation).draw(
                    imagesGen(img.size(targetWidth, targetHeight), targetLeft, targetTop, needWidth, needHeight), 0, 0
                ).save(location, {
                    quality: 90
                })
        } else {
            imagesGen(utilsObj.genImageBGLocation).draw(
                    img.size(targetWidth, targetHeight), targetLeft, targetTop
                ).save(location, {
                    quality: 100
                })
        }
        cb()
    }

    utilsObj.genNewImage = function (url, identify, needHeight, needWidth, cut, cb) {
        var now = new Date;
        var month = now.getUTCMonth() + 1;
        if (month < 10) {
            month = "0" + month;
        }
        var day = now.getUTCDate();
        if (day < 10) {
            day = "0" + day;
        }
        var date = now.getUTCFullYear() + "" + month + "" + day;
        var uri = urlModule.parse(url);
        var iName = utilsObj.getImageNameFromUrl(url).toLowerCase().replace(/%/g, "");
        if ((iName.indexOf(".png") < 0) && (iName.indexOf(".jpg") < 0) && (iName.indexOf(".gif") < 0) && (iName.indexOf(".jpeg") < 0)) {
            iName = "thumbnail" +  parseInt(Math.random() * 1000) + ".jpg";
        }
        var editName = iName.substr(0, iName.lastIndexOf(".")) + now.getUTCMilliseconds() + iName.substr(iName.lastIndexOf("."));
        var location = utilsObj.genImageLocation + date + utilsObj.fileBreaker + identify + utilsObj.fileBreaker + iName;
        var editLocation = utilsObj.genImageLocation + date + utilsObj.fileBreaker + identify + utilsObj.fileBreaker + editName;

        if (!fs.existsSync(utilsObj.genImageLocation + date)) {
            fs.mkdirSync(utilsObj.genImageLocation + date, 0755);
        }
        if (!fs.existsSync(utilsObj.genImageLocation + date + utilsObj.fileBreaker + identify)) {
            fs.mkdirSync(utilsObj.genImageLocation + date + utilsObj.fileBreaker + identify, 0755);
        }
        utilsObj.downloadImage(url, location, function () {
            try {
                var img = imagesGen(location);
            } catch (e) {
                cb(null, null);
                return;
            }
            var height = img.height();
            var width = img.width();
            if (width > 900) {
                img.size(900).save(editLocation, {
                    quality: 90
                });
                cb(editName, date);
//                var targetHeight = img.height();
//                var targetWidth = img.width();
//                var targetLeft = 0;
//                var targetTop = 0;
//                //not cut
//                if ((height / width) > (needHeight / needWidth)) {
//                    //vertical img
//                    if (cut) {
//                        targetWidth = needWidth;
//                        targetHeight = needWidth * height / width;
//                        targetTop = (targetHeight - needHeight) / 2;
//                    } else {
//                        targetHeight = needHeight;
//                        targetWidth = needHeight * width / height;
//                        targetLeft = (needWidth - targetWidth) / 2;
//                    }
//                } else {
//                    //horizontal img
//                    if (cut) {
//                        targetHeight = needHeight;
//                        targetWidth = needHeight * width / height;
//                        targetLeft = (targetWidth - needWidth) / 2;
//                    } else {
//                        targetWidth = needWidth;
//                        targetHeight = needWidth * height / width;
//                        targetTop = (needHeight - targetHeight) / 2;
//                    }
//                }
//                if (cut) {
//                    imagesGen(utilsObj.genImageBGLocation).draw(
//                            imagesGen(img.size(targetWidth, targetHeight), targetLeft, targetTop, needWidth, needHeight), 0, 0
//                        ).save(editLocation, {
//                            quality: 90
//                        })
//                } else {
//                    imagesGen(utilsObj.genImageBGLocation).draw(
//                            img.size(targetWidth, targetHeight), targetLeft, targetTop
//                        ).save(editLocation, {
//                            quality: 90
//                        })
//                }
            } else {
                cb(iName, date)
            }

        });
    }

    utilsObj.getType = function (ext) {
        return types[ext] || "text/plain";
    }

    utilsObj.removeHTMLTag = function (str) {
        str = str.replace(/<\/?[^>]*>/g, ''); //去除HTML tag
        str = str.replace(/[ | ]*\n/g, '\n'); //去除行尾空白
        //str = str.replace(/\n[\s| | ]*\r/g,'\n'); //去除多余空行
        str = str.replace(/&nbsp;/ig, '');//去掉&nbsp;
        return str;
    }

    utilsObj.arrayContains = function contains(ary, obj) {
        for (var i = 0; i < ary.length; i++) {
            if (ary[i] === obj) {
                return true;
            }
        }
        return false;
    }

    utilsObj.knowContentType = ["utf-8", "gbk", "gb2312", "iso-8859-4", "gb18030"];
    utilsObj.urlSourceMap = {
        "singaporeseen.stomp.com.sg": "stomp",
        "www.channel8news.sg": "channel8",
        "163.com": "网易"
    }
    utilsObj.getSource = function (urlDm) {
        if (utilsObj.urlSourceMap[urlDm] == undefined) {
            return urlDm;
        } else {
            return utilsObj.urlSourceMap[urlDm];
        }
    }

    utilsObj.defaultImages = [
        "http://webapi.shabikplus.mozat.com/images/2015/01/29/d3/0/d390c0a920b991fd17b117c95795940820150129.png",
        "http://webapi.shabikplus.mozat.com/images/2015/01/29/e9/0/e9e7e85fc1c6a6f0719c51c06432c93420150129.png",
        "http://webapi.shabikplus.mozat.com/images/2015/01/29/8a/0/8a58cd791c5fa80478f447af81aad4f420150129.png",
        "http://webapi.shabikplus.mozat.com/images/2015/01/29/a5/0/a5e6a2a464c8148ac1a3dd92b8ff818120150129.png",
        "http://webapi.shabikplus.mozat.com/images/2015/01/29/f3/0/f3d80b5915c0fe210a1c828ba01d72e920150129.png",
        "http://webapi.shabikplus.mozat.com/images/2015/01/29/6c/0/6c9c19d66517a84c356825b54b6ce2ad20150129.png"
    ]
    utilsObj.getRandomArray = function (count, array) {
        var ret = [];
        for (var i = 0; i < count; i++) {
            var rindex = parseInt(Math.random() * array.length);
            if (!utilsObj.arrayContains(ret, array[rindex])) {
                ret.push(array[rindex]);
            } else {
                i--;
            }
        }
        return ret;
    }

	utilsObj.getTimeTextFrom = function(time){
		console.log("getTimeTextFrom");
		console.log(time);
		time = parseInt(time)/1000;
		var text = "2 hour ago";
        if (time > 86400000) {
            var d = parseInt(parseInt(time) / 86400000);
            text = d + " day ago";
        } else if (time > 3600000) {
            var h = parseInt(parseInt(time) / 3600000);
            text = h + " hour ago";
        } else if (time > 60000) {
            var m = parseInt(parseInt(time) / 60000);
            text = m + " minute ago";
        } else {
            text = "1 minute ago";
        }
        console.log(text);
        return text;
	}
	
    utilsObj.postNewsToServer = function(tid,title,summary,images,publisher,copright,visibility,content,released_ts,ttl,lang,push_flag,uid)
    {
        var data = {};
        data.service = "INSTMOB_NEWS";
        data.CMD = 3;
        data.userId = uid;
        data.request = {};
        data.request.req_post_news = {};
        data.request.req_post_news.news = {};
        data.request.req_post_news.news.topic_id = tid;
        data.request.req_post_news.news.title = title;
        data.request.req_post_news.news.images = images;
        data.request.req_post_news.news.summary = summary;
        data.request.req_post_news.news.publisher = publisher;
        data.request.req_post_news.news.copright = copright;
        data.request.req_post_news.news.visibility = visibility;
        data.request.req_post_news.news.content = content;
        data.request.req_post_news.news.released_ts = released_ts;
        data.request.req_post_news.news.ttl = ttl;
        data.request.req_post_news.news.lang = lang;
        data.request.req_post_news.news.push_flag = push_flag;
        var dataStr = JSON.stringify(data);
        var requestUrl = utilsObj.serverApi + "/call";
        console.log(requestUrl);
        console.log(dataStr);
        request.post({uri: requestUrl, body: dataStr}, function (err, response, body) {
           console.log(body);
        })
    }

    return utilsObj;
}());
module.exports = utils;