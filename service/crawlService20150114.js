/**
 * Created with JetBrains PhpStorm.
 * User: Administrator
 * Date: 1/5/15
 * Time: 1:37 PM
 * To change this template use File | Settings | File Templates.
 */
var mdbService = require("../service/mdbService");
var utilsService = require("../service/utilsService");
var jsdom = require('jsdom');
var request = require('request');
var fs = require("fs");
var cheerio = require('cheerio');
var crawl = (function () {
    var crawlObj = {};
    crawlObj.name = "crawl service";
    var synObj = {};
    synObj.stomp = {};
    synObj.asiaone = {};

    function stompCrawl(objArray, res) {
        synObj.stomp.totalCount = 0;
        synObj.stomp.finishCount = 0;
        synObj.stomp.dataToShowWhenEnd = [];
        synObj.stomp.totalCount = objArray.length;
        //fake
//        synObj.totalCount = 1;
//        mdbService.findDocument("news",{title:objArray[0].title},function(doc){
//            console.log(doc);
//            crawlNewsObj(objArray[0], res);
//        })
        //end fake
        objArray.forEach(function (obj) {
            mdbService.findDocument("news", {title: obj.title}, function (doc) {
                if (doc == null || doc == [] || doc.length == 0) {
                    mdbService.findDocument("news", {url: obj.url}, function (docu) {
                        if (docu == null || docu == [] || docu.length == 0) {
                            console.log("crawlNewsObj");
                            crawlNewsObj(obj, res);
                        }
                    });
                } else {
                    synObj.stomp.finishCount++;
                    if (synObj.stomp.finishCount == synObj.stomp.totalCount) {
                        res.finishCrawl++;
                        //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                        res.detect(synObj.stomp.dataToShowWhenEnd);
                    }
                }
            })
        })
//        for (var i = 0; i < synObj.totalCount; i++) {
//            mdbService.findDocument("news", {title: objArray[i].title}, function (doc) {
//                if (doc == null) {
//                    synObj.finishCount++;
//                } else {
//                    crawlNewsObj(objArray[_i], res);
//                }
//            })
//        }
    };
    function crawlNewsObj(news, res) {
        request({uri: news.url}, function (err, response, body) {
            var self = this;
            self.items = new Array();//I feel like I want to save my results in an array

            //Just a basic error check
            if (err && response.statusCode !== 200) {
                console.log('Request error.');
            }
            //Send the body param as the HTML code we will parse in jsdom
            //also tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
            var $ = cheerio.load(body);
            var avatar = $(".field-item img").attr("src");
            var content = $(".art_text").html();
//            console.log(content);
//            console.log(avatar);
            //news.content = content;
            news.avatar = avatar;
            if (!avatar) {
                synObj.stomp.finishCount++;
                if (synObj.stomp.finishCount == synObj.stomp.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(synObj.stomp.dataToShowWhenEnd);
                }
                return;
            }
            mdbService.addDocument("news", news, function (id) {
                news.id = id;
                synObj.stomp.dataToShowWhenEnd.push(news);
                var location = utilsService.newsLocation + id;
                try {
                    fs.mkdirSync(location, 0755);
                } catch (e) {
                    console.log(e);
                }
                var type = news.avatar.substr(-4, 4);
                utilsService.downloadImage(news.avatar, location + utilsService.fileBreaker + "thumbnail" + type, function () {
                    utilsService.saveHtml(content, location + utilsService.fileBreaker + "index.html", function () {
                        utilsService.saveFile(JSON.stringify(news), location + utilsService.fileBreaker + "news.config", function () {
                            synObj.stomp.finishCount++;
                            console.log("f" + synObj.stomp.finishCount);
                            console.log("t" + synObj.stomp.totalCount);
                            if (synObj.stomp.finishCount == synObj.stomp.totalCount) {
                                res.finishCrawl++;
                                //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                                res.detect(synObj.stomp.dataToShowWhenEnd);
                            }
                            console.log("success");
                        })
                    })
                });
            });
        });
    };
    crawlObj.getStomp = function (res, sourceObj) {
        var url = sourceObj.stomp;
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
            var newsArray = $('.headline20');
            console.log(newsArray.length);
            var newsObj = [];
            newsArray.each(function () {
                var newObj = {};
                newObj.title = $(this).find("a").text();
                var url = $(this).find("a").attr("href");
                url = url.substr(url.indexOf("singaporeseen"));
                newObj.url = "http://singaporeseen.stomp.com.sg/" + url;
                newObj.source = "stomp";
                newObj.date = utilsService.getUtcTimeStamp();
                newObj.hot = 0;
                newsObj.push(newObj);
            });
            stompCrawl(newsObj, res);
            console.log(mdbService);
        });
    }
    crawlObj.getAsiaOne = function (res, sourceObj) {
        var url = sourceObj.asiaone;
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
            var newsArray = $('.views-row');
            console.log(newsArray.length);
            var newsObj = [];
            newsArray.each(function () {
                var newObj = {};
                newObj.title = $(this).find(".newssectlist_txt").text();
                if(!newObj.title){
                    newObj.title = $(this).find(".news_title_listing").text();
                }
                var url = $(this).find("a").attr("href");
                newObj.url = url;
                newObj.source = "asiaone";
                newObj.date = utilsService.getUtcTimeStamp();
                newObj.hot = 0;
                newsObj.push(newObj);
            });
            asiaoneCrawl(newsObj, res);
            console.log(mdbService);
        });
    }

    function asiaoneCrawl(objArray, res) {
        synObj.asiaone.totalCount = 0;
        synObj.asiaone.finishCount = 0;
        synObj.asiaone.dataToShowWhenEnd = [];
        synObj.asiaone.totalCount = objArray.length;
        //fake
//        synObj.totalCount = 1;
//        obj = objArray[0];
//        mdbService.findDocument("news", {title: obj.title}, function (doc) {
//            if (doc == null || doc == [] || doc.length == 0) {
//                mdbService.findDocument("news", {url: obj.url}, function (docu) {
//                    if (docu == null || docu == [] || docu.length == 0) {
//                        console.log("crawlNewsObj");
//                        crawlNewsObj_asiaone(obj, res);
//                    }
//                });
//            } else {
//                synObj.finishCount++;
//                if (synObj.finishCount == synObj.totalCount) {
//                    res.finishCrawl++;
//                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
//                    res.detect(synObj.dataToShowWhenEnd);
//                }
//            }
//        })
        //end fake
        objArray.forEach(function (obj) {
            mdbService.findDocument("news", {title: obj.title}, function (doc) {
                if (doc == null || doc == [] || doc.length == 0) {
                    mdbService.findDocument("news", {url: obj.url}, function (docu) {
                        if (docu == null || docu == [] || docu.length == 0) {
                            console.log("crawlNewsObj");
                            crawlNewsObj_asiaone(obj, res);
                        }
                    });
                } else {
                    synObj.asiaone.finishCount++;
                    if (synObj.asiaone.finishCount == synObj.asiaone.totalCount) {
                        res.finishCrawl++;
                        //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                        res.detect(synObj.asiaone.dataToShowWhenEnd);
                    }
                }
            })
        })
    };
    function crawlNewsObj_asiaone(news, res) {
        request({uri: news.url}, function (err, response, body) {
            var self = this;
            self.items = new Array();//I feel like I want to save my results in an array

            //Just a basic error check
            if (err && response.statusCode !== 200) {
                console.log('Request error.');
            }
            //Send the body param as the HTML code we will parse in jsdom
            //also tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
            var $ = cheerio.load(body);
            var avatar = "";
            var content = "";
            if(news.url.indexOf("travel.asiaone")>0)
            {
                avatar = $(".article_main_img img").attr("src");
                content = $(".field-items .field-item").html();
            }else if(news.url.indexOf("business.asiaone")>0)
            {
                avatar = $(".field-items .field-item img").attr("src");
                content = $("p").parent().html();
            }else
            {
                avatar = $(".content img").attr("src");
                content = $(".article-content").html();
            }
            if (!avatar || !content) {
                synObj.asiaone.finishCount++;
                if (synObj.asiaone.finishCount == synObj.asiaone.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(synObj.asiaone.dataToShowWhenEnd);
                }
                return;
            }
            if(avatar.indexOf("?")>0)
            {
                avatar = avatar.substr(0,avatar.indexOf("?"));
            }
            content = utilsService.filterHtmlTab(content);
//            console.log(content);
//            console.log(avatar);
            //news.content = content;
            news.avatar = avatar;
            if (!avatar) {
                synObj.asiaone.finishCount++;
                if (synObj.asiaone.finishCount == synObj.asiaone.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(synObj.asiaone.dataToShowWhenEnd);
                }
                return;
            }
            mdbService.addDocument("news", news, function (id) {
                news.id = id;
                synObj.asiaone.dataToShowWhenEnd.push(news);
                var location = utilsService.newsLocation + id;
                try {
                    fs.mkdirSync(location, 0755);
                } catch (e) {
                    console.log(e);
                }
                var type = news.avatar.substr(-4, 4).toLowerCase();
                utilsService.downloadImage(news.avatar, location + utilsService.fileBreaker + "thumbnail" + type, function () {
                    utilsService.saveHtml(content, location + utilsService.fileBreaker + "index.html", function () {
                        utilsService.saveFile(JSON.stringify(news), location + utilsService.fileBreaker + "news.config", function () {
                            synObj.asiaone.finishCount++;
                            console.log("f" + synObj.asiaone.finishCount);
                            console.log("t" + synObj.asiaone.totalCount);
                            if (synObj.asiaone.finishCount == synObj.asiaone.totalCount) {
                                res.finishCrawl++;
                                //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                                res.detect(synObj.asiaone.dataToShowWhenEnd);
                            }
                            console.log("success");
                        })
                    })
                });
            });
        });
    };
    return crawlObj;
}());
module.exports = crawl;