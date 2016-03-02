/**
 * Created with JetBrains PhpStorm.
 * User: Administrator
 * Date: 1/5/15
 * Time: 1:37 PM
 * To change this template use File | Settings | File Templates.
 */
var mdbService = require("../service/mdbService");
var utilsService = require("../service/utilsService");
//var jsdom = require('jsdom');
var request = require('request');
var fs = require("fs");
var cheerio = require('cheerio');
var iconv = require('iconv-lite');
var crawl = (function () {
    var crawlObj = {};
    crawlObj.name = "crawl service";
    var synObj = {};
    synObj.cnalky = {};
    synObj.stomp = {};
    synObj.asiaone = {};
    synObj.trs = {};
    synObj.channelE = {};
    synObj.localNews = {};
    synObj.localNews = {};
    synObj.NanYangView = {};
    synObj.Wangyi = {};
    synObj.kr = {};
    synObj.zhihu = {};
    synObj.dataToShowWhenEnd = [];
    synObj.huxiu = [];
    function newsCrawl(objArray, res, limitObj) {
        console.log("newsCrawl");
        limitObj.totalCount = 0;
        limitObj.finishCount = 0;
        limitObj.dataToShowWhenEnd = [];
        limitObj.totalCount = objArray.length;
//        //fake
//        obj = objArray[0];
//        limitObj.totalCount = 1;
//        crawlNewsObj_channelE(obj, res, limitObj);
//        //fake
        objArray.forEach(function (obj) {
            mdbService.findDocument("news", {title: obj.title}, function (doc) {
                if (doc == null || doc == [] || doc.length == 0) {
                    mdbService.findDocument("news", {url: obj.url}, function (docu) {
                        if (docu == null || docu == [] || docu.length == 0) {
                            console.log(obj.source);
                            if (obj.source == "CNA-LKY") {
                                crawlNewsObj_cnalky(obj, res, limitObj);
                            } else if (obj.source == "stomp") {
                                crawlNewsObj_stomp(obj, res, limitObj);
                            } else if (obj.source == "asiaone") {
                                crawlNewsObj_asiaone(obj, res, limitObj);
                            } else if (obj.source == "trs") {
                                crawlNewsObj_trs(obj, res, limitObj);
                            } else if (obj.source == "channel8") {
                                crawlNewsObj_channelE(obj, res, limitObj);
                            } else if (obj.source == "localNews") {
                                crawlNewsObj_localNews(obj, res, limitObj);
                            } else if (obj.source == "NanYangView") {
                                crawlNewsObj_nanYangView(obj, res, limitObj);
                            } else if (obj.source == "Wangyi") {
                                crawlNewsObj_wangyi(obj, res, limitObj);
                            } else if (obj.source == "kr") {
                                crawlNewsObj_kr(obj, res, limitObj);
                            }else if (obj.source == "zhihu") {
                                crawlNewsObj_zhihu(obj, res, limitObj);
                            }else if (obj.source == "huxiu") {
                                crawlNewsObj_huxiu(obj, res, limitObj);
                            }
                        } else {
                            limitObj.finishCount++;
                            if (limitObj.finishCount == limitObj.totalCount) {
                                res.finishCrawl++;
                                //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                                res.detect(limitObj.dataToShowWhenEnd);
                            }
                        }
                    });
                } else {
                    limitObj.finishCount++;
                    if (limitObj.finishCount == limitObj.totalCount) {
                        res.finishCrawl++;
                        //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                        res.detect(limitObj.dataToShowWhenEnd);
                    }
                }
            })
        })
    };

    function downloadNews(news, content, limitObj, res) {
        mdbService.addDocument("news", news, function (id) {
            news.id = id;
            //limitObj.dataToShowWhenEnd.push(news);
            var location = utilsService.newsLocation + id;
            try {
                fs.mkdirSync(location, 0755);
            } catch (e) {
                console.log(e);
            }
            var type = ".jpg";
            if (news.avatar.lastIndexOf(".") > 0) {
                type = news.avatar.toLowerCase().substr(news.avatar.lastIndexOf("."))
            }
            if (type != ".jpg" && type != ".jpeg" && type != ".gif" && type != ".png") {
                type = ".jpg";
            }
            utilsService.downloadImage(news.avatar, location + utilsService.fileBreaker + "thumbnail" + type, function () {
                utilsService.resizeImage(location + utilsService.fileBreaker + "thumbnail" + type, 900, 500, true, function () {
                    utilsService.saveHtml(content, location + utilsService.fileBreaker + "index.html", function () {
                        utilsService.saveFile(JSON.stringify(news), location + utilsService.fileBreaker + "news.config", function () {
                            limitObj.finishCount++;
                            console.log("f" + limitObj.finishCount);
                            console.log("t" + limitObj.totalCount);
                            console.log("success");
                            if(news.source == "channel8" || news.source == "36kr" || news.source == "虎嗅" ||  news.source == "网易")
                            {
                                var ttl = 86400000;
                                utilsService.postNewsToServer(1,news.title,"",[utilsService.selfUrl+"news/" + news.id + "/thumbnail" + type],news.source,news.source + "fan",true,content,Date.parse(new Date()),ttl,"zh",0,99999);
                            }


                            if (news.source == "网易fake") {
                                console.log("crawl comment for wangyi");
                                var url = news.url;
                                crawlCommentObj_wangyi(url, id, function () {
                                    if (limitObj.finishCount == limitObj.totalCount) {
                                        res.finishCrawl++;
                                        //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                                        res.detect(limitObj.dataToShowWhenEnd);
                                    }
                                })
                            } else {
                                if (limitObj.finishCount == limitObj.totalCount) {
                                    res.finishCrawl++;
                                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                                    res.detect(limitObj.dataToShowWhenEnd);
                                }
                            }
                        })
                    })
                });
            });
        });
    }


    crawlObj.getCnaLky = function (res, sourceObj){
        var url = sourceObj.cnalky;
        request({uri: url}, function(err, response, body){
            var self =this;
            self.items = new Array();

            if (err && (response && response.statusCode && response.statusCode !== 200)){
                res.finishCrawl++;
                res.detect(synObj.dataToShowWhenEnd);
                console.log('request error');
                return;
            }

            var $ = cheerio.load(body);
            var newsArray  = $('.holder');
            var newsObj = [];
            newsArray.each(function(){
                var newObj = {};
                newObj.title = $(this).find("a").attr('title');
                var url = $(this).find("a").attr('href');
                newObj.url = "http://www.channelnewsasia.com/" + url;
                newObj.source = "CNA-LKY";
                newObj.date = utilsService.getUtcTimeStamp();
                newObj.hot = 0;
                newObj.type = 0;
                newsObj.push(newObj);
            });
            newsCrawl(newsObj, res, synObj.cnalky);
        });
    }

    function crawlNewsObj_cnalky(news, res, limitObj) {
        request({uri:news.url}, function (err, response, body){
            var self = this;
            self.items = new Array();
            if (err && (response.statusCode && response.statusCode !== 200)){
                console.log('Request error.');
            }
            var $ = cheerio.load(body);
            var avatar = $('.pdd-items').attr('src');
            var content = $('.text-area').html();
            content = utilsService.filterHtmlTab(content);
            news.avatar = avatar;
            if (!avatar) {
                limitObj.finishCount++;
                if (limitObj.finishCount == limitObj.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(limitObj.dataToShowWhenEnd);
                }
                return;
            }
            try {
                downloadNews(news, content, limitObj, res);
            } catch (e) {
                limitObj.finishCount++;
                if (limitObj.finishCount == limitObj.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(limitObj.dataToShowWhenEnd);
                }
                return;
            }

        });
    };


    crawlObj.getStomp = function (res, sourceObj) {
        var url = sourceObj.stomp;
        request({uri: url}, function (err, response, body) {
            var self = this;
            self.items = new Array();//I feel like I want to save my results in an array

            //Just a basic error check
            if (err && (response && response.statusCode && response.statusCode !== 200)) {
                res.finishCrawl++;
                //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                res.detect(synObj.dataToShowWhenEnd);
                return;
                console.log('Request error.');
            }
            //Send the body param as the HTML code we will parse in jsdom
            //also tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
            var $ = cheerio.load(body);
            var newsArray = $('.headline20');
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
                newObj.type = 0;
                newsObj.push(newObj);
            });
            newsCrawl(newsObj, res, synObj.stomp);
        });
    }

    function crawlNewsObj_stomp(news, res, limitObj) {
        request({uri: news.url}, function (err, response, body) {
            var self = this;
            self.items = new Array();//I feel like I want to save my results in an array

            //Just a basic error check
            if (err && (response && response.statusCode && response.statusCode !== 200)) {
                console.log('Request error.');
            }
            //Send the body param as the HTML code we will parse in jsdom
            //also tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
            var $ = cheerio.load(body);
            var avatar = $(".field-item img").attr("src");
            var content = $(".art_text").html();
            content = utilsService.filterHtmlTab(content);
            news.avatar = avatar;
            if (!avatar) {
                limitObj.finishCount++;
                if (limitObj.finishCount == limitObj.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(limitObj.dataToShowWhenEnd);
                }
                return;
            }
            try {
                downloadNews(news, content, limitObj, res);
            } catch (e) {
                limitObj.finishCount++;
                if (limitObj.finishCount == limitObj.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(limitObj.dataToShowWhenEnd);
                }
                return;
            }
        });
    };

    crawlObj.getAsiaOne = function (res, sourceObj) {
        var url = sourceObj.asiaone;
        request({uri: url}, function (err, response, body) {
            var self = this;
            self.items = new Array();//I feel like I want to save my results in an array

            //Just a basic error check
            if (err && (response && response.statusCode && response.statusCode !== 200)) {
                res.finishCrawl++;
                //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                res.detect(limitObj.dataToShowWhenEnd);
                return;
                console.log('Request error.');
            }
            //Send the body param as the HTML code we will parse in jsdom
            //also tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
            var $ = cheerio.load(body);
            var newsArray = $('.views-row');
            var newsObj = [];
            newsArray.each(function () {
                var newObj = {};
                newObj.title = $(this).find("h3 a").text();
                if (!newObj.title) {
                    newObj.title = $(this).find(".news_title_listing").text();
                }
                var url = $(this).find("a").attr("href");
                newObj.url = url;
                newObj.source = "asiaone";
                newObj.date = utilsService.getUtcTimeStamp();
                newObj.hot = 0;
                newObj.type = 0;
                newsObj.push(newObj);
            });
            newsCrawl(newsObj, res, synObj.asiaone);
        });
    }


    function crawlNewsObj_asiaone(news, res, limitObj) {
        request({uri: news.url}, function (err, response, body) {
            var self = this;
            self.items = new Array();//I feel like I want to save my results in an array

            //Just a basic error check
            if (err && (response && response.statusCode && response.statusCode !== 200)) {
                console.log('Request error.');
            }
            //Send the body param as the HTML code we will parse in jsdom
            //also tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
            var $ = cheerio.load(body);
            var avatar = "";
            var content = "";
            if (news.url.indexOf("travel.asiaone") > 0) {
                avatar = $(".article_main_img img").attr("src");
                content = $(".field-items .field-item").html();
            } else if (news.url.indexOf("business.asiaone") > 0) {
                avatar = $(".field-items .field-item img").attr("src");
                content = $("p").parent().html();
            } else {
                avatar = $(".content img").attr("src");
                content = $(".article-content").html();
            }
            if (!avatar || !content || (avatar.indexOf(".gif") > 0)) {
                limitObj.finishCount++;
                if (limitObj.finishCount == limitObj.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(limitObj.dataToShowWhenEnd);
                }
                return;
            }
            if (avatar.indexOf("?") > 0) {
                avatar = avatar.substr(0, avatar.indexOf("?"));
            }
            content = utilsService.filterHtmlTab(content);
//            console.log(content);
//            console.log(avatar);
            //news.content = content;
            news.avatar = avatar;
            if (!avatar) {
                limitObj.finishCount++;
                if (limitObj.finishCount == limitObj.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(limitObj.dataToShowWhenEnd);
                }
                return;
            }
            try {
                downloadNews(news, content, limitObj, res);
            } catch (e) {
                limitObj.finishCount++;
                if (limitObj.finishCount == limitObj.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(limitObj.dataToShowWhenEnd);
                }
                return;
            }
        });
    };

    crawlObj.getTrs = function (res, sourceObj) {
        var url = sourceObj.trs;
        request({uri: url}, function (err, response, body) {
            var self = this;
            self.items = new Array();//I feel like I want to save my results in an array

            //Just a basic error check
            if (err && (response && response.statusCode && response.statusCode !== 200)) {
                res.finishCrawl++;
                //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                res.detect(synObj.dataToShowWhenEnd);
                return;
                console.log('Request error.');
            }
            //Send the body param as the HTML code we will parse in jsdom
            //also tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
            var $ = cheerio.load(body);
            var newsArray = $('h2.node__title');
            var newsObj = [];
            newsArray.each(function () {
                var newObj = {};
                newObj.title = $(this).find("a").text();
                var url = "http://therealsingapore.com" + $(this).find("a").attr("href");
                newObj.url = url;
                newObj.source = "trs";
                newObj.date = utilsService.getUtcTimeStamp();
                newObj.hot = 0;
                newObj.type = 0;
                newsObj.push(newObj);
            });
            newsCrawl(newsObj, res, synObj.trs);
        });
    }

    function crawlNewsObj_trs(news, res, limitObj) {
        request({uri: news.url}, function (err, response, body) {
            var self = this;
            self.items = new Array();//I feel like I want to save my results in an array

            //Just a basic error check
            if (err && (response && response.statusCode && response.statusCode !== 200)) {
                console.log('Request error.');
            }
            //Send the body param as the HTML code we will parse in jsdom
            //also tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
            var $ = cheerio.load(body);
            var avatar = $(".field-name-field-image img").attr("src");
            var content = "";
            $(".field-type-text-with-summary .field-item").each(function () {
                content = content + $(this).html();
            })
            if (!avatar || !content) {
                limitObj.finishCount++;
                if (limitObj.finishCount == limitObj.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(synObj.dataToShowWhenEnd);
                }
                return;
            }
            if (avatar.indexOf("?") > 0) {
                avatar = avatar.substr(0, avatar.indexOf("?"));
            }
            content = utilsService.filterHtmlTab(content);
            news.avatar = avatar;
            if (!avatar) {
                limitObj.finishCount++;
                if (limitObj.finishCount == limitObj.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(limitObj.dataToShowWhenEnd);
                }
                return;
            }
            try {
                console.log(news.id);
                downloadNews(news, content, limitObj, res);
            } catch (e) {
                limitObj.finishCount++;
                if (limitObj.finishCount == limitObj.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(limitObj.dataToShowWhenEnd);
                }
                return;
            }
        });
    };


    crawlObj.getChannelE = function (res, sourceObj) {
        var url = sourceObj.channel8;
        request({uri: url}, function (err, response, body) {
            var self = this;
            self.items = new Array();//I feel like I want to save my results in an array

            //Just a basic error check
            if (err && (response && response.statusCode && response.statusCode !== 200)) {
                res.finishCrawl++;
                //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                res.detect(synObj.dataToShowWhenEnd);
                console.log('Request error.');
                return;
            }
            //Send the body param as the HTML code we will parse in jsdom
            //also tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
            var $ = cheerio.load(body);
            var newsArray = $('.article').not(".hidden");
            var newsObj = [];
            newsArray.each(function () {
                var newObj = {};
                newObj.title = $(this).find(".articleheader a").text();
                var url = "http://www.channel8news.sg" + $(this).find(".articleheader a").attr("href");
                newObj.url = url;
                newObj.source = "channel8";
                newObj.date = utilsService.getUtcTimeStamp();
                newObj.hot = 0;
                newObj.type = 1;
                if ($(this).find(".articleimage .imagebox img").attr("src").indexOf("http://") >= 0) {
                    newObj.avatar = $(this).find(".articleimage .imagebox img").attr("src");
                } else {
                    newObj.avatar = "http://www.channel8news.sg" + $(this).find(".articleimage .imagebox img").attr("src");
                }
                newsObj.push(newObj);
            });
            newsCrawl(newsObj, res, synObj.channelE);
        });
    }

    function crawlNewsObj_channelE(news, res, limitObj) {
        request({uri: news.url}, function (err, response, body) {
            var self = this;
            self.items = new Array();//I feel like I want to save my results in an array

            //Just a basic error check
            if (err && (response && response.statusCode && response.statusCode !== 200)) {
                res.finishCrawl++;
                //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                res.detect(limitObj.dataToShowWhenEnd);
                return;
                console.log('Request error.');
            }
            //Send the body param as the HTML code we will parse in jsdom
            //also tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
            var $ = cheerio.load(body);
            var avatar = $(".imagebox img").attr("src");
            if (!avatar || avatar == "") {
                avatar = news.avatar;
            } else {
                avatar = "http://www.channel8news.sg" + avatar;
            }
            $(".articlecontent").find(".articleresources").remove();
            var content = $(".articlecontent").html();
            if (!avatar || !content) {
                limitObj.finishCount++;
                if (limitObj.finishCount == limitObj.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(limitObj.dataToShowWhenEnd);
                }
                return;
            }
            if (avatar.indexOf("?") > 0) {
                avatar = avatar.substr(0, avatar.indexOf("?"));
            }
            content = utilsService.filterHtmlTab(content);

            news.avatar = avatar;
            if (!avatar) {
                limitObj.finishCount++;
                if (limitObj.finishCount == limitObj.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(limitObj.dataToShowWhenEnd);
                }
                return;
            }
            try {
                downloadNews(news, content, limitObj, res);
            } catch (e) {
                console.log(e);
                limitObj.finishCount++;
                if (limitObj.finishCount == limitObj.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(limitObj.dataToShowWhenEnd);
                }
                return;
            }
        });
    };

    crawlObj.getLocalNews = function (res, sourceObj) {
        var url = sourceObj.localNews;
        request({uri: url}, function (err, response, body) {
            var self = this;
            self.items = new Array();//I feel like I want to save my results in an array

            //Just a basic error check
            if (err && (response && response.statusCode && response.statusCode !== 200)) {
                console.log('Request error.');
                res.finishCrawl++;
                //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                res.detect(synObj.dataToShowWhenEnd);
                return;
            }
            //Send the body param as the HTML code we will parse in jsdom
            //also tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
            var $ = cheerio.load(body);
            var newsArray = $('#masonry-box .list-detail');
            var newsObj = [];
            newsArray.each(function () {
                var newObj = {};
                newObj.title = $(this).find(".title").text();
                var url = $(this).find(".title").attr("href");
                newObj.url = url;
                newObj.source = "localNews";
                newObj.realSource = $(this).find(".list-detail .pub").text();
                newObj.date = utilsService.getUtcTimeStamp();
                newObj.hot = 0;
                if (newObj.title.match(/[^\x00-\x80]/g) == null) {
                    newObj.type = 0;
                } else {
                    newObj.type = 1;
                }
                newsObj.push(newObj);
            });
            newsCrawl(newsObj, res, synObj.localNews);
        });
    }

    function crawlNewsObj_localNews(news, res, limitObj) {
        request({uri: news.url}, function (err, response, body) {
            var self = this;
            self.items = new Array();//I feel like I want to save my results in an array

            //Just a basic error check
            if (err && (response && response.statusCode && response.statusCode !== 200)) {
                console.log('Request error.');
            }
            //Send the body param as the HTML code we will parse in jsdom
            //also tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
            var $ = cheerio.load(body);
            var avatar = $("#pic-holder img").attr("src");
            if ($(".storybox p").last().text().indexOf(news.realSource) >= 0) {
                $(".storybox p").last().remove();
            }
            var content = $(".storybox").html();
            if (!avatar || !content) {
                limitObj.finishCount++;
                if (limitObj.finishCount == limitObj.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(limitObj.dataToShowWhenEnd);
                }
                return;
            }
            if (avatar.indexOf("?") > 0) {
                avatar = avatar.substr(0, avatar.indexOf("?"));
            }
            content = utilsService.filterHtmlTab(content);
            news.avatar = avatar;
            if (!avatar) {
                limitObj.finishCount++;
                if (limitObj.finishCount == limitObj.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(limitObj.dataToShowWhenEnd);
                }
                return;
            }
            if (news.realSource) {
                news.source = news.realSource;
            }
            try {
                downloadNews(news, content, limitObj, res);
            } catch (e) {
                console.log(e);
                limitObj.finishCount++;
                if (limitObj.finishCount == limitObj.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(limitObj.dataToShowWhenEnd);
                }
                return;
            }
        });
    };


    crawlObj.getNanYangView = function (res, sourceObj) {
        var url = sourceObj.NanYangView;
        request({uri: url}, function (err, response, body) {
            var self = this;
            self.items = new Array();//I feel like I want to save my results in an array

            //Just a basic error check
            if (err && (response && response.statusCode && response.statusCode !== 200)) {
                console.log('Request error.');
                res.finishCrawl++;
                //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                res.detect(synObj.dataToShowWhenEnd);
                return;
            }
            //Send the body param as the HTML code we will parse in jsdom
            //also tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
            var $ = cheerio.load(body);
            var newsArray = $('#Blog1 .postbox');
            var newsObj = [];
            newsArray.each(function () {
                var newObj = {};
                newObj.title = $(this).find(".postbox-right h2").text();
                newObj.title = newObj.title.replace(/[\r\n]/g, "");
                var url = $(this).find(".postbox-right h2 a").attr("href");
                newObj.url = url;
                newObj.source = "NanYangView";
                newObj.date = utilsService.getUtcTimeStamp();
                newObj.hot = 0;
                newObj.type = 1;
                newsObj.push(newObj);
            });
            newsCrawl(newsObj, res, synObj.NanYangView);
        });
    }

    function crawlNewsObj_nanYangView(news, res, limitObj) {
        request({uri: news.url}, function (err, response, body) {
            var self = this;
            self.items = new Array();//I feel like I want to save my results in an array

            //Just a basic error check
            if (err && (response && response.statusCode && response.statusCode !== 200)) {
                console.log('Request error.');
            }
            news.source = "南洋视界";
            //Send the body param as the HTML code we will parse in jsdom
            //also tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
            var $ = cheerio.load(body);
            var avatar = $(".separator img").attr("src");
            var content = $(".separator").parent().html();
            if (!avatar || !content) {
                limitObj.finishCount++;
                if (limitObj.finishCount == limitObj.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(limitObj.dataToShowWhenEnd);
                }
                return;
            }
            if (avatar.indexOf("?") > 0) {
                avatar = avatar.substr(0, avatar.indexOf("?"));
            }
            content = utilsService.filterHtmlTab(content);
            content = content.replace(/<div class="separator" (.+?)>(.+?)<\/div>/ig, "");
            content = content.substr(0, content.lastIndexOf("&#x8BF7;&#x52A0;&#x5165;&#x6211;&#x4EEC;&#x7684;"));
            news.avatar = avatar;
            if (!avatar) {
                limitObj.finishCount++;
                if (limitObj.finishCount == limitObj.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(limitObj.dataToShowWhenEnd);
                }
                return;
            }
            try {
                downloadNews(news, content, limitObj, res);
            } catch (e) {
                console.log(e);
                limitObj.finishCount++;
                if (limitObj.finishCount == limitObj.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(limitObj.dataToShowWhenEnd);
                }
                return;
            }
        });
    };

    crawlObj.getWangyi = function (res, sourceObj) {
        var url = sourceObj.wangyi;
        var options = {
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.52 Safari/537.36'
            },
            encoding: null
        };
        request(options, function (err, response, body) {
            var self = this;
            self.items = new Array();//I feel like I want to save my results in an array

            //Just a basic error check
            if (err && (response && response.statusCode && response.statusCode !== 200)) {
                console.log('Request error.');
                res.finishCrawl++;
                //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                res.detect(synObj.dataToShowWhenEnd);
                return;
            }
            //Send the body param as the HTML code we will parse in jsdom
            //also tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
            body = iconv.decode(body, 'gb2312');
            var $ = cheerio.load(body);
            $("#whole").next().find(".tabContents").eq(0).find("tr").first().remove();
            var newsArray = $("#whole").next().find(".tabContents").eq(0).find("tr");
            $("#whole").next().next().find(".tabContents").eq(0).find("tr").first().remove();
            var newsArrayT = $("#whole").next().next().find(".tabContents").eq(0).find("tr");
            var newsObj = [];
            newsArray.each(function () {
                var newObj = {};
                newObj.title = $(this).find("a").text();
                var url = $(this).find("a").attr("href");
                newObj.url = url;
                newObj.source = "Wangyi";
                newObj.date = utilsService.getUtcTimeStamp();
                newObj.hot = 0;
                newObj.type = 1;
                newsObj.push(newObj);
            });
            newsArrayT.each(function () {
                var newObj = {};
                newObj.title = $(this).find("a").text();
                var url = $(this).find("a").attr("href");
                newObj.url = url;
                newObj.source = "Wangyi";
                newObj.date = utilsService.getUtcTimeStamp();
                newObj.hot = 0;
                newObj.type = 1;
                newsObj.push(newObj);
            });
            newsCrawl(newsObj, res, synObj.Wangyi);
        });
    }

    function crawlNewsObj_wangyi(news, res, limitObj) {
//        news.url = "http://war.163.com/15/0119/07/AGAAVPO200011MTO.html";
        var options = {
            url: news.url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.52 Safari/537.36'
            },
            encoding: null
        };
        request(options, function (err, response, body) {
            var self = this;
            self.items = new Array();//I feel like I want to save my results in an array

            //Just a basic error check
            if (err && (response && response.statusCode && response.statusCode !== 200)) {
                console.log('Request error.');
            }
            body = iconv.decode(body, 'gb2312');
            news.source = "网易";
            //Send the body param as the HTML code we will parse in jsdom
            //also tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
            var $ = cheerio.load(body);
            var avatar = $("textarea.hidden").find("i").first().text();
            var content = "";
            $(".end-text").each(function () {
                $(this).find(".ep-source").remove();
                $(this).find(".nvt_vote_2").remove();
                content = content + $(this).html();
            })
            if (!avatar) {
                avatar = $("#endText").first().find("img").first().attr("src");
            }
            if (!content) {
                $("#endText").find(".ep-source").remove();
                $("#endText").find(".nvt_vote_2").remove();
                content = $("#endText").html();
            }
//            console.log("avatar" + avatar);
//            console.log("content" + content);
//            console.log("content" + content);
//            console.log("contentAfterRemove" + contentAfterRemove);
            if (!avatar || !content) {
                limitObj.finishCount++;
                if (limitObj.finishCount == limitObj.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(limitObj.dataToShowWhenEnd);
                }
                return;
            }
            if (avatar.indexOf("?") > 0) {
                avatar = avatar.substr(0, avatar.indexOf("?"));
            }
            content = utilsService.filterHtmlTab(content);
//            content = content.replace(/<div(.+?)>(.+?)<\/div>/ig, "");
            var contentAfterRemove = utilsService.removeHTMLTag(content).trim();
            if (!contentAfterRemove) {
                limitObj.finishCount++;
                if (limitObj.finishCount == limitObj.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(limitObj.dataToShowWhenEnd);
                }
                return;
            }
//            content = content.replace(/<div class="separator" (.+?)>(.+?)<\/div>/ig, "");
//            content = content.substr(0, content.lastIndexOf("&#x8BF7;&#x52A0;&#x5165;&#x6211;&#x4EEC;&#x7684;"));
            news.avatar = avatar;
            if (!avatar) {
                limitObj.finishCount++;
                if (limitObj.finishCount == limitObj.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(limitObj.dataToShowWhenEnd);
                }
                return;
            }
            try {
                downloadNews(news, content, limitObj, res);
            } catch (e) {
                console.log(e);
                limitObj.finishCount++;
                if (limitObj.finishCount == limitObj.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(limitObj.dataToShowWhenEnd);
                }
                return;
            }
        });
    };

    function crawlCommentObj_wangyi(url, nid, cb) {
        var articleStr = url.substr(url.lastIndexOf("/") + 1).substr(0, url.substr(url.lastIndexOf("/") + 1).indexOf("."))
        if (url.indexOf("http://ent.163.com/") >= 0) {
            url = "http://comment.ent.163.com/data/ent2_bbs/df/" + articleStr + "_1.html";
        } else if (url.indexOf("http://news.163.com/") >= 0) {
            url = "http://comment.news.163.com/data/news3_bbs/df/" + articleStr + "_1.html";
        } else {
            cb();
        }
        console.log(url);
        var options = {
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.52 Safari/537.36'
            },
            encoding: null
        };
        request(options,function (err, response, body) {
            var self = this;
            self.items = new Array();//I feel like I want to save my results in an array

            //Just a basic error check
            if (err && (response && response.statusCode && response.statusCode !== 200)) {
                console.log('Request error.');
                cb();
            }
            body = iconv.decode(body, 'utf-8');
            var content = body.substr(body.indexOf("={") + 1).substr(0, body.substr(body.indexOf("={") + 1).length - 1);
            try {
                content = JSON.parse(content);
                var commentCount = 10;
                for (var i = 0; i < commentCount && i < content.hotPosts.length; i++) {
                    var comment = {};
                    comment.date = utilsService.getUtcTimeStamp();
                    comment.tid = nid;
                    comment.user = content.hotPosts[i][1].n;
                    comment.content = content.hotPosts[i][1].b;
                    mdbService.addDocument("comment", comment, function (id) {

                    });
                }
                cb();
            } catch (e) {
                cb();
            }
        }).on("error", function (err) {
                console.log(err);
                cb();
            });
    }


    crawlObj.getKr = function (res, sourceObj) {
        //console.log('running getKr...');
        var url = sourceObj.kr;
        var options = {
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.52 Safari/537.36'
            }
//            encoding: null
        };
        request(options, function (err, response, body) {
            var self = this;
            self.items = new Array();//I feel like I want to save my results in an array

            //Just a basic error check
            if (err && (response && response.statusCode && response.statusCode !== 200)) {
                console.log('Request error.');
                res.finishCrawl++;
                //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                res.detect(synObj.dataToShowWhenEnd);
                return;
            }
            //Send the body param as the HTML code we will parse in jsdom
            //also tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
//            body = iconv.decode(body, 'gb2312');
            var $ = cheerio.load(body);

            var newsArray = $(".articles .posts");
            var newsObj = [];
            newsArray.each(function () {
                //console.log('running getKr array...');
                var newObj = {};
                var title = $(this).find(".right-col h1").text().trim();
                console.log('title:', title);
                var url = $(this).find(".right-col h1").find("a").attr("href");
                console.log('url:', url);
                newObj.url = url;
                newObj.title = title;
                newObj.source = "kr";
                newObj.date = utilsService.getUtcTimeStamp();
                newObj.hot = 0;
                newObj.type = 1;
                newsObj.push(newObj);
            });
            newsCrawl(newsObj, res, synObj.kr);
        });
    }

    function crawlNewsObj_kr(news, res, limitObj) {
//        news.url = "http://36kr.com/columns/breaking";
        var options = {
            url: news.url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.52 Safari/537.36'
            }
        };
        request(options, function (err, response, body) {
            var self = this;
            self.items = new Array();//I feel like I want to save my results in an array

            //Just a basic error check
            if (err && (response && response.statusCode && response.statusCode !== 200)) {
                console.log('Request error.');
            }
            news.source = "36kr";
            //Send the body param as the HTML code we will parse in jsdom
            //also tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
            var $ = cheerio.load(body);
            var avatar = $(".single-post").find("img").first().attr("src");
            $(".single-post").find("img").first().remove();
            $(".single-post .article p").last().remove();
            $(".single-post .article p").last().remove();
            if ($(".single-post .article p").last().text().indexOf("新版36氪iOS 客户端正式上线") >= 0) {
                $(".single-post .article p").last().remove();
            }
            if ($(".single-post .article p").last().text().indexOf("36氪不作任何形式背书") >= 0) {
                $(".single-post .article p").last().remove();
            }
            var content = $(".single-post .article").html();
            if (!avatar || !content) {
                limitObj.finishCount++;
                if (limitObj.finishCount == limitObj.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(limitObj.dataToShowWhenEnd);
                }
                return;
            }
            if (avatar.indexOf("?") > 0) {
                avatar = avatar.substr(0, avatar.indexOf("?"));
            }
            content = utilsService.filterHtmlTab(content);
//            content = content.replace(/<div(.+?)>(.+?)<\/div>/ig, "");
            var contentAfterRemove = utilsService.removeHTMLTag(content).trim();
            if (!contentAfterRemove) {
                limitObj.finishCount++;
                if (limitObj.finishCount == limitObj.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(limitObj.dataToShowWhenEnd);
                }
                return;
            }
//            content = content.replace(/<div class="separator" (.+?)>(.+?)<\/div>/ig, "");
//            content = content.substr(0, content.lastIndexOf("&#x8BF7;&#x52A0;&#x5165;&#x6211;&#x4EEC;&#x7684;"));
            news.avatar = avatar;
            if (!avatar) {
                limitObj.finishCount++;
                if (limitObj.finishCount == limitObj.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(limitObj.dataToShowWhenEnd);
                }
                return;
            }
            try {
                downloadNews(news, content, limitObj, res);
            } catch (e) {
                console.log(e);
                limitObj.finishCount++;
                if (limitObj.finishCount == limitObj.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(limitObj.dataToShowWhenEnd);
                }
                return;
            }
        });
    };

    crawlObj.getHuxiu = function (res, sourceObj) {
        //console.log('running getHuxiu...');
        var url = sourceObj.huxiu;
        var options = {
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.52 Safari/537.36'
            }
        };
        request(options, function (err, response, body) {
            var self = this;
            self.items = new Array();//I feel like I want to save my results in an array

            //Just a basic error check
            if (err && (response && response.statusCode && response.statusCode !== 200)) {
                console.log('Request error.');
                res.finishCrawl++;
                //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                res.detect(synObj.dataToShowWhenEnd);
                return;
            }
            //Send the body param as the HTML code we will parse in jsdom
            //also tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
//            body = iconv.decode(body, 'gb2312');
            var $ = cheerio.load(body);

            var newsArray = $(".mod-info-flow .mod-art");
            //var newsArray = $(".mod-info-flow .mod-point-of-view");
            //newsArray = newsArray.concat($(".mod-info-flow .mod-art"));
            var newsObj = [];
            var idx = 1;
            newsArray.each(function () {
                //console.log('running huxiu array...');
                //console.log('idx:', idx++);
                var newObj = {};
                var title = $(this).find(".mob-ctt h3").text().trim();
                //console.log('title:', title);
                var url = sourceObj.huxiu + $(this).find(".mob-ctt h3").find("a").attr("href");
                //console.log('url:', url);
                newObj.url = url;
                newObj.title = title;
                newObj.source = "huxiu";
                newObj.date = utilsService.getUtcTimeStamp();
                newObj.hot = 0;
                newObj.type = 1;
                newsObj.push(newObj);
            });
            newsCrawl(newsObj, res, synObj.huxiu);
        });
    }

    function crawlNewsObj_huxiu(news, res, limitObj) {
//        news.url = "http://36kr.com/columns/breaking";
        console.log("crawlNews_Huxiu");
        var options = {
            url: news.url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.52 Safari/537.36'
            }
        };
        request(options, function (err, response, body) {
            var self = this;
            self.items = new Array();//I feel like I want to save my results in an array

            //Just a basic error check
            if (err && (response && response.statusCode && response.statusCode !== 200)) {
                console.log('Request error.');
            }
            news.source = "虎嗅";
            //Send the body param as the HTML code we will parse in jsdom
            //also tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
            var $ = cheerio.load(body);
            var avatar = $(".art-ctt-iframe").find("img").first().attr("src");
            //console.log('avatar:', avatar);
            var content = $(".article-content-wrap").html();
            //console.log('content:', content);
            if (!avatar || !content) {
                limitObj.finishCount++;
                if (limitObj.finishCount == limitObj.totalCount) {
                    res.finishCrawl++;
                    res.detect(limitObj.dataToShowWhenEnd);
                }
                return;
            }
            if (avatar.indexOf("?") > 0) {
                avatar = avatar.substr(0, avatar.indexOf("?"));
            }

            //console.log('avatar:', avatar);
            //console.log('content:', content);

            content = utilsService.filterHtmlTab(content);
            var contentAfterRemove = utilsService.removeHTMLTag(content).trim();
            if (!contentAfterRemove) {
                limitObj.finishCount++;
                if (limitObj.finishCount == limitObj.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(limitObj.dataToShowWhenEnd);
                }
                return;
            }
            news.avatar = avatar;
            if (!avatar) {
                limitObj.finishCount++;
                if (limitObj.finishCount == limitObj.totalCount) {
                    res.finishCrawl++;
                    res.detect(limitObj.dataToShowWhenEnd);
                }
                return;
            }
            try {
                downloadNews(news, content, limitObj, res);
            } catch (e) {
                console.log(e);
                limitObj.finishCount++;
                if (limitObj.finishCount == limitObj.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(limitObj.dataToShowWhenEnd);
                }
                return;
            }
        });
    };

    crawlObj.getZhihu = function (res, sourceObj) {
        var url = sourceObj.zhihu;
        var options = {
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.52 Safari/537.36'
            }
//            encoding: null
        };
        request(options, function (err, response, body) {
            var self = this;
            self.items = new Array();//I feel like I want to save my results in an array

            //Just a basic error check
            if (err && (response && response.statusCode && response.statusCode !== 200)) {
                console.log('Request error.');
                res.finishCrawl++;
                //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                res.detect(synObj.dataToShowWhenEnd);
                return;
            }
            //Send the body param as the HTML code we will parse in jsdom
            //also tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
//            body = iconv.decode(body, 'gb2312');
            var $ = cheerio.load(body);
            var newsArray = $(".tab-panel").first().find(".feed-item");
            console.log(newsArray.length);
            var newsObj = [];
            newsArray.each(function () {
                var newObj = {};
                newObj.title = $(this).find("h2 a").text();
                var url = "http://www.zhihu.com" + $(this).find("h2 a").attr("href");
                newObj.url = url;
                newObj.source = "zhihu";
                newObj.date = utilsService.getUtcTimeStamp();
                newObj.hot = 0;
                newObj.type = 1;
                newsObj.push(newObj);
            });
//            res.end(JSON.stringify(newsObj));
            newsCrawl(newsObj, res, synObj.zhihu);
        });
    }

    function crawlNewsObj_zhihu(news, res, limitObj) {
//        news.url = "http://war.163.com/15/0119/07/AGAAVPO200011MTO.html";
        var options = {
            url: news.url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.52 Safari/537.36'
            }
        };
        request(options, function (err, response, body) {
            var self = this;
            self.items = new Array();//I feel like I want to save my results in an array

            //Just a basic error check
            if (err && (response && response.statusCode && response.statusCode !== 200)) {
                console.log('Request error.');
            }
            news.source = "知乎";
            //Send the body param as the HTML code we will parse in jsdom
            //also tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
            var $ = cheerio.load(body);
            var avatar = $("#zh-question-detail").find("img").first().attr("src");
            if (!avatar || avatar == "") {
                avatar = $("#zh-question-answer-wrap .zm-editable-content").find("img").first().attr("src");
            }
            $("#zh-question-answer-wrap").find(".zm-editable-content").find("img").each(function(){
                if ($(this).attr("src").indexOf("//") == 0) {
                   if($(this).attr("class").indexOf("lazy") >=0)
                   {
                       $(this).attr("src",$(this).attr("data-actualsrc"));
                   }
                }
            })
            var content = $("#zh-question-answer-wrap").find(".zm-editable-content").html();
            if (!avatar || !content) {
                limitObj.finishCount++;
                if (limitObj.finishCount == limitObj.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(limitObj.dataToShowWhenEnd);
                }
                return;
            }
            if (avatar.indexOf("?") > 0) {
                avatar = avatar.substr(0, avatar.indexOf("?"));
            }
            content = utilsService.filterHtmlTab(content);
            content = content.replace("::before", "");
//            content = content.replace(/<div(.+?)>(.+?)<\/div>/ig, "");
            var contentAfterRemove = utilsService.removeHTMLTag(content).trim();
            if (!contentAfterRemove) {
                limitObj.finishCount++;
                if (limitObj.finishCount == limitObj.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(limitObj.dataToShowWhenEnd);
                }
                return;
            }
//            content = content.replace(/<div class="separator" (.+?)>(.+?)<\/div>/ig, "");
//            content = content.substr(0, content.lastIndexOf("&#x8BF7;&#x52A0;&#x5165;&#x6211;&#x4EEC;&#x7684;"));
            news.avatar = avatar;
            if (!avatar) {
                limitObj.finishCount++;
                if (limitObj.finishCount == limitObj.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(limitObj.dataToShowWhenEnd);
                }
                return;
            }
            try {
                downloadNews(news, content, limitObj, res);
            } catch (e) {
                console.log(e);
                limitObj.finishCount++;
                if (limitObj.finishCount == limitObj.totalCount) {
                    res.finishCrawl++;
                    //res.end(JSON.stringify(synObj.dataToShowWhenEnd));
                    res.detect(limitObj.dataToShowWhenEnd);
                }
                return;
            }
        });
    };


    return crawlObj;
}());
module.exports = crawl;