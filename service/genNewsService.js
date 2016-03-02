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
var urlModule = require('url');
var sizeOf = require('image-size');
var http = require('http');
var https = require('https');
var genNews = (function () {
        var genNewsObj = {};
        genNewsObj.genNewsFromUrl = function (res, uid, url) {
            console.log("import url:" + url);
            var ret = {};
            //ret.images = getDefaultImages();
            ret.images = [];
            var genNewsHistory = {};
            genNewsHistory.date = utilsService.getUtcTimeStamp();
            genNewsHistory.uid = uid;
            genNewsHistory.cost = new Date();
            var maxTime = new Date() + 3000;
            genNewsHistory.retimages = [];
            if (url.indexOf("web.toutiao.com") >= 0) {
                url = url.replace("web.toutiao.com", "m.toutiao.com")
            }
            var uri = urlModule.parse(url);
            genNewsHistory.source = uri.host;
            genNewsHistory.url = url;
            var ua = 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.52 Safari/537.36';
            if (uri.host.indexOf("m.") == 0) {
                ua = 'Mozilla/5.0 (Linux; Android 4.2.1; en-us; Nexus 4 Build/JOP40D) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.166 Mobile Safari/535.19';
            } else if (url.indexOf("http://bbs.sgcn.com") >= 0) {
                ua = 'Mozilla/5.0 (Linux; Android 4.2.1; en-us; Nexus 4 Build/JOP40D) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.166 Mobile Safari/535.19';
            }
//        if (url.indexOf("toutiao.com") >= 0) {
//            ua = 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.52 Safari/537.36';
//        }
            var options = {
                url: url,
                headers: {
//                'User-Agent': 'Mozilla/5.0 (Linux; Android 4.2.1; en-us; Nexus 4 Build/JOP40D) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.166 Mobile Safari/535.19'
                    'User-Agent': ua
                },
                encoding: null
            };
            request(options, function (err, response, body) {
                var self = this;
                if (err && (response && response.statusCode && response.statusCode !== 200)) {
                    console.log('Request error.');
                    var retError = {};
                    retError.code = 1;
                    res.end(JSON.stringify(retError));
                    return;
                }
                //Send the body param as the HTML code we will parse in jsdom
                //also tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
                var contentType = 'utf-8';
                //console.log(response.headers['content-type']);
                var cType = response.headers['content-type'].substr(response.headers['content-type'].indexOf("charset") + 8);
                //console.log(cType);
                if (uri.href.indexOf("http://nc.jxnews.com.cn/") >= 0 || uri.href.indexOf("http://m.toutiao.com/") >= 0|| uri.href.indexOf("http://news.eastday.com") >= 0 || uri.href.indexOf("sina.com.cn")>=0) {
                    contentType = "gb2312";
                }
                if (utilsService.arrayContains(utilsService.knowContentType, cType.toLowerCase())) {
                    contentType = cType;
                }
                body = iconv.decode(body, contentType);
                var $ = cheerio.load(body, {decodeEntities: false});
                $ = filterContentBeforeQuery($, uri);
                ret.title = crawlTitle($, uri);
                ret.content = crawlContent($, uri);
                ret.source = utilsService.getSource(uri.host);
                genNewsHistory.pagecost = new Date() - genNewsHistory.cost;
                var tout = 9000 - (genNewsHistory.pagecost);
                if (tout > 0 && (utilsService.mode != "local")) {
                    console.log("tout" + tout);
                    setTimeout(function () {
                        console.log(new Date() - genNewsHistory.cost);
                        console.log("un finish return" + JSON.stringify(ret));
                        res.end(JSON.stringify(ret));
                        return;
                    }, tout)
                }

//            res.end(JSON.stringify(ret));
//            return;
                var imagesObject = [];
                var imagesUrl = [];
                var imagesObjectAfterCalculate = [];

//            $("p").eq(2).parent().find("img").each(function () {
//                if ($(this).attr("src")) {
//                    var imageObj = {};
//                    if ($(this).attr("src").indexOf("//") == 0) {
//                        imageObj.url = uri.protocol + $(this).attr("src");
//                    } else if ($(this).attr("src").indexOf("/") == 0) {
//                        imageObj.url = uri.protocol + "//" + uri.host + $(this).attr("src");
//                    } else if ($(this).attr("src").indexOf("http") == 0) {
//                        imageObj.url = $(this).attr("src");
//                    } else {
//                        imageObj.url = url.substr(0, url.lastIndexOf("/") + 1) + $(this).attr("src");
//                    }
//                    if (imageObj.url.indexOf("?") > 0) {
//                        imageObj.url = imageObj.url.substr(0, imageObj.url.indexOf("?"));
//                    }
//                    imageObj.priority = 10;
//                    imageObj.index = -1;
//                    if (imageObj.url.toLowerCase().indexOf(".gif") < 0 && imageObj.url.toLowerCase().indexOf(".svg") < 0) {
//                        if (imageObj.url.toLowerCase().indexOf(".jpg") > 0 || imageObj.url.toLowerCase().indexOf(".jpeg") > 0) {
//                            imageObj.type = 0; //jpg
//                        } else if (imageObj.url.toLowerCase().indexOf(".png") > 0) {
//                            imageObj.type = 1; //png
//                        } else {
//                            imageObj.type = 2; //others
//                        }
//                        if (!utilsService.arrayContains(imagesUrl, imageObj.url)) {
//                            imagesUrl.push(imageObj.url);
//                            imagesObject.push(imageObj);
//                        }
//                    }
//                }
//            });
//            console.log(imagesObject.length);
//            $("p").eq(2).parent().next().find("img").each(function () {
//                if ($(this).attr("src")) {
//                    var imageObj = {};
//                    if ($(this).attr("src").indexOf("//") == 0) {
//                        imageObj.url = uri.protocol + $(this).attr("src");
//                    } else if ($(this).attr("src").indexOf("/") == 0) {
//                        imageObj.url = uri.protocol + "//" + uri.host + $(this).attr("src");
//                    } else if ($(this).attr("src").indexOf("http") == 0) {
//                        imageObj.url = $(this).attr("src");
//                    } else {
//                        imageObj.url = url.substr(0, url.lastIndexOf("/") + 1) + $(this).attr("src");
//                    }
//                    if (imageObj.url.indexOf("?") > 0) {
//                        imageObj.url = imageObj.url.substr(0, imageObj.url.indexOf("?"));
//                    }
//                    imageObj.priority = 10;
//                    imageObj.index = -1;
//                    if (imageObj.url.toLowerCase().indexOf(".gif") < 0 && imageObj.url.toLowerCase().indexOf(".svg") < 0 && imageObj.url.toLowerCase().indexOf("data:image") < 0) {
//                        if (imageObj.url.toLowerCase().indexOf(".jpg") > 0 || imageObj.url.toLowerCase().indexOf(".jpeg") > 0) {
//                            imageObj.type = 0; //jpg
//                        } else if (imageObj.url.toLowerCase().indexOf(".png") > 0) {
//                            imageObj.type = 1; //png
//                        } else {
//                            imageObj.type = 2; //others
//                        }
//                        if (!utilsService.arrayContains(imagesUrl, imageObj.url)) {
//                            imagesUrl.push(imageObj.url);
//                            imagesObject.push(imageObj);
//                        }
//                    }
//                }
//            });
//            console.log(imagesObject.length);
//            $("p").eq(2).parent().prev().find("img").each(function () {
//                if ($(this).attr("src")) {
//                    var imageObj = {};
//                    if ($(this).attr("src").indexOf("//") == 0) {
//                        imageObj.url = uri.protocol + $(this).attr("src");
//                    } else if ($(this).attr("src").indexOf("/") == 0) {
//                        imageObj.url = uri.protocol + "//" + uri.host + $(this).attr("src");
//                    } else if ($(this).attr("src").indexOf("http") == 0) {
//                        imageObj.url = $(this).attr("src");
//                    } else {
//                        imageObj.url = url.substr(0, url.lastIndexOf("/") + 1) + $(this).attr("src");
//                    }
//                    if (imageObj.url.indexOf("?") > 0) {
//                        imageObj.url = imageObj.url.substr(0, imageObj.url.indexOf("?"));
//                    }
//                    imageObj.priority = 10;
//                    imageObj.index = -1;
//                    if (imageObj.url.toLowerCase().indexOf(".gif") < 0 && imageObj.url.toLowerCase().indexOf(".svg") < 0 && imageObj.url.toLowerCase().indexOf("data:image") < 0) {
//                        if (imageObj.url.toLowerCase().indexOf(".jpg") > 0 || imageObj.url.toLowerCase().indexOf(".jpeg") > 0) {
//                            imageObj.type = 0; //jpg
//                        } else if (imageObj.url.toLowerCase().indexOf(".png") > 0) {
//                            imageObj.type = 1; //png
//                        } else {
//                            imageObj.type = 2; //others
//                        }
//                        if (!utilsService.arrayContains(imagesUrl, imageObj.url)) {
//                            imagesUrl.push(imageObj.url);
//                            imagesObject.push(imageObj);
//                        }
//                    }
//                }
//            });
                $("img").each(function (inx) {
                    if (uri.href.indexOf("http://m.nandu.com/m/n/") >= 0) {
                        if ($(this).attr("alt_src")) {
                            $(this).attr("src", $(this).attr("alt_src"));
                        }
                    } else if (uri.href.indexOf("i.ifeng.com") >= 0) {
                        if ($(this).attr("original")) {
                            $(this).attr("src", $(this).attr("original"));
                        }
                    } else if (uri.href.indexOf("mp.weixin.qq.com") >= 0) {
                        if ($(this).attr("data-src")) {
                            $(this).attr("src", $(this).attr("data-src"));
                        }
                    }
                    if ($(this).attr("src")) {
                        var imageObj = {};
                        if ($(this).attr("src").indexOf("//") == 0) {
                            imageObj.url = uri.protocol + $(this).attr("src");
                        } else if ($(this).attr("src").indexOf("/") == 0) {
                            imageObj.url = uri.protocol + "//" + uri.host + $(this).attr("src");
                        } else if ($(this).attr("src").indexOf("http") == 0) {
                            imageObj.url = $(this).attr("src");
                        } else {
                            imageObj.url = url.substr(0, url.lastIndexOf("/") + 1) + $(this).attr("src");
                        }
                        if (imageObj.url.indexOf("?") > 0) {
                            imageObj.url = imageObj.url.substr(0, imageObj.url.indexOf("?"));
                        }
                        imageObj.priority = 1;
                        imageObj.index = inx;
                        if (imageObj.url.toLowerCase().indexOf(".gif") < 0 && imageObj.url.toLowerCase().indexOf(".svg") < 0 && imageObj.url.toLowerCase().indexOf("data:image") < 0) {
                            if (imageObj.url.toLowerCase().indexOf(".jpg") > 0 || imageObj.url.toLowerCase().indexOf(".jpeg") > 0) {
                                imageObj.type = 0; //jpg
                            } else if (imageObj.url.toLowerCase().indexOf(".png") > 0) {
                                imageObj.type = 1; //png
                            } else {
                                imageObj.type = 2; //others
                            }
                            if (!utilsService.arrayContains(imagesUrl, imageObj.url)) {
                                imagesUrl.push(imageObj.url);
                                imagesObject.push(imageObj);
                            }
                        }
                    }
                });
                if (uri.href.indexOf("http://mp.weixin.qq.com/s") >= 0) {
                    var scriptHtml = $("#page-content script").html();
                    var cover = null;
                    if (scriptHtml) {
                        cover = scriptHtml.substr(scriptHtml.indexOf("cover = \"") + 9).substr(0, scriptHtml.substr(scriptHtml.indexOf("cover = \"") + 9).indexOf("\""));
                    }
                    $("script").remove();
                    if (cover) {
                        var imageObj = {};
                        if (cover.indexOf("//") == 0) {
                            imageObj.url = uri.protocol + $(this).attr("src");
                        } else if (cover.indexOf("/") == 0) {
                            imageObj.url = uri.protocol + "//" + uri.host + cover;
                        } else if (cover.indexOf("http") == 0) {
                            imageObj.url = cover;
                        } else {
                            imageObj.url = url.substr(0, url.lastIndexOf("/") + 1) + cover;
                        }
                        if (imageObj.url.indexOf("?") > 0) {
                            imageObj.url = imageObj.url.substr(0, imageObj.url.indexOf("?"));
                        }
                        imageObj.priority = 1;
                        imageObj.index = 10;
                        if (imageObj.url.toLowerCase().indexOf(".gif") < 0 && imageObj.url.toLowerCase().indexOf(".svg") < 0 && imageObj.url.toLowerCase().indexOf("data:image") < 0) {
                            if (imageObj.url.toLowerCase().indexOf(".jpg") > 0 || imageObj.url.toLowerCase().indexOf(".jpeg") > 0) {
                                imageObj.type = 0; //jpg
                            } else if (imageObj.url.toLowerCase().indexOf(".png") > 0) {
                                imageObj.type = 1; //png
                            } else {
                                imageObj.type = 2; //others
                            }
                            if (!utilsService.arrayContains(imagesUrl, imageObj.url)) {
                                imagesUrl.push(imageObj.url);
                                imagesObject.push(imageObj);
                            }
                        }
                    }
                }


                console.log("start download images : " + ((new Date() - genNewsHistory.cost) / 1000));
                fixCrawlForSpecialUrl(uri, imagesObject, ret, $, function (bridgeObj) {
                    ret = bridgeObj.ret;
                    ret.content =  ret.content + '<p style="color:#333"><a href="' + url + '">Original Page</a></p>';
                    genNewsHistory.rettitle = ret.title;
                    genNewsHistory.retcontent = ret.content;
                    imagesObject = bridgeObj.images;
                    var imgsCount = imagesObject.length;
                    var finishCrawlCount = 0;
                    if (imgsCount == 0) {
                        genNewsHistory.retimages = [];
                        ret.images.forEach(function (obj) {
                            genNewsHistory.retimages.push(obj.url);
                        });
                        mdbService.addDocument("genurlhistory", genNewsHistory, function (id) {
                            res.end(JSON.stringify(ret));
                        })
                        return;
                    }
                    console.log("foreach");
                    imagesObject.forEach(function (obj) {
                        //if(obj.url!="https://s.yimg.com/bt/api/res/1.2/C8h3XE19jCTSHvQ5zng5UQ--/YXBwaWQ9eW5ld3M7Zmk9Zml0O2g9Njk-/http://l.yimg.com/os/publish-images/news/2013-03-01/70225864-dbcf-4a00-827c-9fe9a930576b_RVB_AFP_20CM.jpg") return;
                        var options = urlModule.parse(obj.url);
                        var httpObj = http;
                        if (obj.url.indexOf("https://") >= 0) {
                            httpObj = https;
                        }
                        httpObj.get(options,function (response) {
                            console.log("statusCode: ", response.statusCode);
                            if (err && (response && response.statusCode && response.statusCode !== 200)) {
                                finishCrawlCount++;
                                if (finishCrawlCount == imgsCount) {
                                    ret.images = getExtraSiteUrl(imagesObjectAfterCalculate);
                                    calculateImages(imagesObjectAfterCalculate, function (calculateDImages) {
                                        var returnImagesCount = calculateDImages.length;
                                        console.log(calculateDImages.length);
                                        var returnImagesDownloadedCount = 0;
                                        var returnImages = [];
                                        if (returnImagesDownloadedCount == returnImagesCount) {
                                            res.end(JSON.stringify(ret));
                                        }
                                        calculateDImages.forEach(function (obj) {
                                            utilsService.genNewImage(obj.url, uid, 500, 900, true, function (editName, date) {
                                                if (editName == null && date == null) {
                                                    returnImagesDownloadedCount++;
                                                    if (returnImagesDownloadedCount == returnImagesCount) {
                                                        if (returnImages.length > 0) {
                                                            ret.images = returnImages;
                                                            ret.images.sort(sourImages);
                                                        }
                                                        mdbService.addDocument("genurlhistory", genNewsHistory, function (id) {
                                                            res.end(JSON.stringify(ret));
                                                        })
                                                    }
                                                } else {
                                                    var returnImageObj = {};
                                                    returnImageObj.url = utilsService.selfUrl + "genimages/" + date + "/" + uid + "/" + editName;
                                                    returnImageObj.priority = obj.priority;
                                                    genNewsHistory.retimages.push(returnImageObj.url);
                                                    //console.log(returnImageObj);
                                                    returnImages.push(returnImageObj);
                                                    returnImagesDownloadedCount++;
                                                    if (returnImagesDownloadedCount == returnImagesCount) {
                                                        if (returnImages.length > 0) {
                                                            ret.images = returnImages;
                                                            ret.images.sort(sourImages);
                                                        }
                                                        mdbService.addDocument("genurlhistory", genNewsHistory, function (id) {
                                                            res.end(JSON.stringify(ret));
                                                        })
                                                    }
                                                }
                                            })
                                        })
                                    })
                                }
                                return;
                            }
                            var chunks = [];
                            response.on('data',function (chunk) {
                                chunks.push(chunk);
                            }).on('end', function () {
                                    var buffer = Buffer.concat(chunks);
                                    try {
                                        obj.width = sizeOf(buffer).width;
                                        obj.height = sizeOf(buffer).height;
                                    } catch (e) {
                                        obj.width = 350;
                                        obj.height = 160;
                                    }
                                    obj.priority = calculateImagePriority(obj);
                                    imagesObjectAfterCalculate.push(obj);
                                    finishCrawlCount++;
                                    if (finishCrawlCount == imgsCount) {
                                        console.log("after get size from all images : " + ((new Date() - genNewsHistory.cost) / 1000));
                                        ret.images = getExtraSiteUrl(imagesObjectAfterCalculate);
                                        calculateImages(imagesObjectAfterCalculate, function (calculateDImages) {
//                                        console.log(calculateDImages);
                                            var returnImagesCount = calculateDImages.length;
                                            var returnImagesDownloadedCount = 0;
                                            var returnImages = [];
                                            if (returnImagesDownloadedCount == returnImagesCount) {
                                                if (returnImages.length > 0) {
                                                    ret.images = returnImages;
                                                    ret.images.sort(sourImages);
                                                }
                                                mdbService.addDocument("genurlhistory", genNewsHistory, function (id) {
                                                    res.end(JSON.stringify(ret));
                                                    return;
                                                })
                                            }
                                            calculateDImages.forEach(function (obj) {
                                                utilsService.genNewImage(obj.url, uid, 500, 900, true, function (editName, date) {
                                                    if (editName == null && date == null) {
                                                        returnImagesDownloadedCount++;
                                                        if (returnImagesDownloadedCount == returnImagesCount) {
                                                            if (returnImages.length > 0) {
                                                                ret.images = returnImages;
                                                                ret.images.sort(sourImages);
                                                            }
                                                            mdbService.addDocument("genurlhistory", genNewsHistory, function (id) {
                                                                res.end(JSON.stringify(ret));
                                                                return;
                                                            })
                                                        }
                                                    } else {
                                                        var returnImageObj = {};
                                                        returnImageObj.url = utilsService.selfUrl + "genimages/" + date + "/" + uid + "/" + editName;
                                                        returnImageObj.priority = obj.priority;
                                                        genNewsHistory.retimages.push(returnImageObj.url + "?priority=" + obj.priority);
                                                        //console.log(returnImageObj);
                                                        returnImages.push(returnImageObj);
                                                        returnImagesDownloadedCount++;
                                                        if (returnImagesDownloadedCount == returnImagesCount) {
                                                            console.log("after download ret images : " + ((new Date() - genNewsHistory.cost) / 1000));
                                                            if (returnImages.length > 0) {
                                                                ret.images = returnImages;
                                                                ret.images.sort(sourImages);
                                                            }
                                                            mdbService.addDocument("genurlhistory", genNewsHistory, function (id) {
                                                                res.end(JSON.stringify(ret));
                                                                return;
                                                            })
                                                        }
                                                    }
                                                })
                                            })
                                        })
                                    }
                                })
                        }).on('error', function (err) {
                                finishCrawlCount++;
                                if (finishCrawlCount == imgsCount) {
                                    ret.images = getExtraSiteUrl(imagesObjectAfterCalculate);
                                    calculateImages(imagesObjectAfterCalculate, function (calculateDImages) {
                                        var returnImagesCount = calculateDImages.length;
                                        var returnImagesDownloadedCount = 0;
                                        var returnImages = [];
                                        if (returnImagesDownloadedCount == returnImagesCount) {
                                            if (returnImages.length > 0) {
                                                ret.images = returnImages;
                                                ret.images.sort(sourImages);
                                            }
                                            mdbService.addDocument("genurlhistory", genNewsHistory, function (id) {
                                                res.end(JSON.stringify(ret));
                                                return;
                                            })
                                        }
                                        calculateDImages.forEach(function (obj) {
                                            utilsService.genNewImage(obj.url, uid, 500, 900, true, function (editName, date) {
                                                if (editName == null && date == null) {
                                                    returnImagesDownloadedCount++;
                                                    if (returnImagesDownloadedCount == returnImagesCount) {
                                                        if (returnImages.length > 0) {
                                                            ret.images = returnImages;
                                                            ret.images.sort(sourImages);
                                                        }
                                                        mdbService.addDocument("genurlhistory", genNewsHistory, function (id) {
                                                            res.end(JSON.stringify(ret));
                                                            return;
                                                        })
                                                    }
                                                } else {
                                                    var returnImageObj = {};
                                                    returnImageObj.url = utilsService.selfUrl + "genimages/" + date + "/" + uid + "/" + editName;
                                                    returnImageObj.priority = obj.priority;
                                                    genNewsHistory.retimages.push(returnImageObj.url + "?priority=" + obj.priority);
                                                    //console.log(returnImageObj);
                                                    returnImages.push(returnImageObj);
                                                    returnImagesDownloadedCount++;
                                                    if (returnImagesDownloadedCount == returnImagesCount) {
                                                        if (returnImages.length > 0) {
                                                            ret.images = returnImages;
                                                            ret.images.sort(sourImages);
                                                        }
                                                        mdbService.addDocument("genurlhistory", genNewsHistory, function (id) {
                                                            res.end(JSON.stringify(ret));
                                                            return;
                                                        })
                                                    }
                                                }
                                            })
                                        })
                                    })
                                }
                                console.log("crawl image error" + err);
                            });
                    });
                });
            });
        }
        //crawl title;
        function crawlTitle($, uri) {
            var ret = $("title").text();
            if (uri.href.indexOf("mp.weixin.qq.com") >= 0) {
                if ($("h2").eq(0).text().length > 0) {
                    ret = $("h2").eq(0).text();
                }
            } else if (uri.href.indexOf("http://view.inews.qq.com/") >= 0) {
                if ($("#content .title").text().length > 0) {
                    ret = $("#content .title").text();
                }
            }
            //ret = "月28日，山西太原迎来降雪天气，民众冒雪出行。据中央气象台消息，1月27日起至30日，一场大范围的雨雪天气将横扫中国中东部大部地区。山西、陕西、河南、湖北、湖南部分地区将有中到大雪，局地有暴雪，这";
            ret = ret.replace(/[\r\n\t]/g, "");
            ret = ret.replace(/&nbsp/g, "");
            ret = ret.replace(/&#8211;/g, "-");
            ret = ret.replace(/&amp;/g, "&");

            ret = ret.trim();
            var len = ret.match(/[^ -~]/g) == null ? ret.length : ret.length + ret.match(/[^ -~]/g).length;
            if (len > 64) {
                if ((ret.length + 10) < len) {
                    //chinese title
                    ret = ret.substr(0, 30) + "...";
                } else {
                    ret = ret.substr(0, 60) + "...";
                }
            }
            return ret;
        }

        function crawlContent($, uri) {
            try {
                if (uri && uri.href.indexOf("http://www.acfun.tv/a/") >= 0 && $("#area-player").text().length > 0) {
                    return utilsService.filterHtmlTab($("#area-player").html());
                } else if (uri && uri.href.indexOf("http://mp.weixin.qq.com/s?") >= 0 && $("#js_content").text().length > 0) {
                    if ($("#js_content p").last().text() && $("#js_content p").last().text().indexOf("阅读原文") >= 0) {
                        $("#js_content p").last().remove();
                    }
                    $("img").each(function (inx) {
                        if ($(this).attr("data-src")) {
                            $(this).attr("src", $(this).attr("data-src"));
                        }
                    });
                    return utilsService.filterHtmlTab($("#js_content").html());
                } else if (uri && uri.href.indexOf("http://tech.sina.cn/") >= 0 && $("#j_articleContent").text().length > 0) {
                    return utilsService.filterHtmlTab($("#j_articleContent").html());
                } else if (uri && uri.href.indexOf("http://tech.sina.cn/") >= 0 && $(".art_t").eq(0).text().length > 0) {
                    return utilsService.filterHtmlTab($(".art_t").eq(0).parent().html());
                } else if(uri && uri.href.indexOf("http://36kr.com/p/") >= 0)
                {
                    return utilsService.filterHtmlTab($(".content .article").html());
                }
                else {
                    var ret = "";
                    var length = $("p").length;
                    var space = 1;
                    if (length > 40) {
                        space = 2;
                    } else if (length > 80) {
                        space = 3;
                    }
                    var divs = [];
                    for (var i = 0; i < length; i = i + space) {
                        var div = $("p").eq(i);
                        if (div && (div.text().length > 0)) {
                            divs.push(div);
                        }
                    }
                    if (uri.href.indexOf("http://bbs.sgcn.com/") >= 0) {
                        var messageLen = $(".message").length;
                        for (var ml = 0; ml < messageLen; ml = ml + 1) {
                            var div = $(".message").eq(ml);
                            if (div && (div.text().length > 0)) {
                                divs.push(div);
                            }
                        }
                    }
                    divs.sort(sourByTextLength);
                    var html = utilsService.filterHtmlTab(divs[0].parent().html());
                    //var html = utilsService.filterHtmlTab(divs[0].parent().text());
//            console.log(html);
//            console.log(divs[0].text());
                    return html;
                }
            }
            catch
                (e) {
                console.log(e);
                return "";
            }
        }

        function calculateImages(images, cb) {
            console.log("finish image crawl");
            var calculatedImages = [];
            images.sort(sourImages);
            for (var i = 0; i < 3 && i < images.length; i++) {
                calculatedImages.push(images[i]);
            }
            console.log(calculatedImages);
            if (calculatedImages[0] && calculatedImages[0].priority > 10) {
                var newRet = [];
                newRet.unshift(calculatedImages[0]);
                if (calculatedImages[1] && calculatedImages[1].priority > 8) {
                    newRet.unshift(calculatedImages[1]);
                }
                if (calculatedImages[2] && calculatedImages[2].priority > 6) {
                    newRet.unshift(calculatedImages[2]);
                }
                newRet.sort(sourImages);
                cb(newRet);
            } else {
                cb(calculatedImages);
            }
        }

        function sourByTextLength(a, b) {
//        return b.text().replace(/\s+/g,'').length - a.text(). replace(/\s+/g,'').length;
            return b.text().trim().length - a.text().trim().length;
        }

        function sourImages(a, b) {
//        var priorityA = a.priority;
//        var priorityB = b.priority;
//        if (a.width < 300) {
//            priorityA -= 6;
//        }
//        if (a.width > 500) {
//            priorityA += 6;
//        }
//        if (a.height < 150) {
//            priorityA -= 6;
//        }
//        if (a.height > 250) {
//            priorityA += 6;
//        }
//        if (b.width < 300) {
//            priorityB -= 6;
//        }
//        if (b.width > 500) {
//            priorityB += 6;
//        }
//        if (b.height < 150) {
//            priorityB -= 6;
//        }
//        if (b.height > 250) {
//            priorityB += 6;
//        }
//        if (a.type == 2) {
//            priorityA -= 10;
//        }
//        if (b.type == 2) {
//            priorityB -= 10;
//        }
            return b.priority - a.priority;
        }

        function calculateImagePriority(imageObj) {
            var priority = imageObj.priority;
            if (imageObj.width < 300) {
                priority -= 6;
            }
            if (imageObj.width > 500) {
                priority += 6;
            }
            if (imageObj.height < 150) {
                priority -= 6;
            }
            if (imageObj.height > 250) {
                priority += 6;
            }
            if (imageObj.type == 2) {
                priority -= 5;
            }
            priority = priority + (imageObj.width + imageObj.height) / 1000;
            return priority;
        }

        function filterContentBeforeQuery($, uri) {
//        console.log(uri);
            $(".gg-ad").remove();
            if (uri.href.indexOf("http://mp.weixin.qq.com/s") < 0) {
                $("script").remove();
            }
            $(".copyright").remove();
            $("video").remove();
            $(".embedded-hyper").remove();
            $("#page-bookmark-links-head").remove();
            $(".social-links").remove();
            $('i[title="img"]').remove();//163
            $('i[title="timg"]').remove();//163
            $("#invideocon").remove();//qq
            $("#page_container_articlelevel .region-content .photo_gallery").remove(); // stomp
            if (uri && (uri.href.indexOf("http://news.asiaone.com/") >= 0)) {
                $(".related_col").remove();
                $(".embed").remove();
            } else if (uri && (uri.href.indexOf("http://www.china.com.cn/") >= 0)) {
                $("#autopage").remove();
            } else if (uri && (uri.href.indexOf("i.ifeng.com/news/sharenews.f") >= 0)) {
                $(".open-pop").remove();
            } else if (uri && (uri.href.indexOf("http://www.it51share.com/") >= 0)) {
                $(".sidebar .widget").remove();
            }
            return $;
        }

        function isSpecialUrl(uri) {
            if (uri.href.indexOf("http://3g.163.com/touch/article.html") >= 0) {
                return true;
            }
            return false;
        }

        function fixCrawlForSpecialUrl(uri, imagesArray, obj, $, cb) {
            var bridgeObj = {};
            bridgeObj.ret = obj;
            bridgeObj.images = imagesArray;
            if (uri.href.indexOf("http://3g.163.com/touch/article.html") >= 0 || uri.href.indexOf("http://3g.163.com/ntes/special/0034073A/wechat_article.html") >= 0) {
                if (uri.href.toLowerCase().indexOf("docid") < 0) {
                    cb(bridgeObj);
                    return;
                }
                var articleStr = uri.href.substr(uri.href.toLowerCase().indexOf("docid") + 6);
                if (articleStr.indexOf("&") >= 0) {
                    articleStr = articleStr.substr(0, articleStr.indexOf("&"));
                }
                var extraUrl = uri.protocol + "//" + uri.host + "/touch/article/" + articleStr + "/full.html";
                var options = {
                    url: extraUrl,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Linux; Android 4.2.1; en-us; Nexus 4 Build/JOP40D) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.166 Mobile Safari/535.19'
//                    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.52 Safari/537.36'
                    },
                    encoding: null
                };
                request(options, function (err, response, body) {
                    var self = this;
                    if (err && (response && response.statusCode && response.statusCode !== 200)) {
                        console.log('Request error.');
                        cb(bridgeObj);
                        return;
                    }
                    //Send the body param as the HTML code we will parse in jsdom
                    //also tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
                    var contentType = 'utf-8';
                    //console.log(response.headers['content-type']);
                    var cType = response.headers['content-type'].substr(response.headers['content-type'].indexOf("charset") + 8);
//                console.log(cType);
                    if (utilsService.arrayContains(utilsService.knowContentType, cType.toLowerCase())) {
                        contentType = cType;
                    }
                    try {
                        body = iconv.decode(body, contentType);
                        body = body.substring(12);
                        body = body.substring(0, body.length - 1);
                        body = JSON.parse(body);
                        body = body[articleStr];
                        bridgeObj.ret.content = utilsService.filterHtmlTab(body.body);
                        bridgeObj.ret.title = utilsService.filterHtmlTab(body.title);
                        if (body.img && body.img.length > 0) {
                            bridgeObj.images = [];
                            var imageObj = {};
                            imageObj.priority = 10;
                            imageObj.index = -1;
                            imageObj.url = body.img[0].src;
                            if (imageObj.url.toLowerCase().indexOf(".gif") < 0 && imageObj.url.toLowerCase().indexOf(".svg") < 0) {
                                if (imageObj.url.toLowerCase().indexOf(".jpg") > 0 || imageObj.url.toLowerCase().indexOf(".jpeg") > 0) {
                                    imageObj.type = 0; //jpg
                                } else if (imageObj.url.toLowerCase().indexOf(".png") > 0) {
                                    imageObj.type = 1; //png
                                } else {
                                    imageObj.type = 2; //others
                                }
                                bridgeObj.images.push(imageObj);
                            }
                        } else if (body.photoSetList && body.photoSetList.length > 0) {
                            bridgeObj.images = [];
                            var imageObj = {};
                            imageObj.priority = 10;
                            imageObj.index = -1;
                            imageObj.url = body.photoSetList[0].cover;
                            if (imageObj.url.toLowerCase().indexOf(".gif") < 0 && imageObj.url.toLowerCase().indexOf(".svg") < 0) {
                                if (imageObj.url.toLowerCase().indexOf(".jpg") > 0 || imageObj.url.toLowerCase().indexOf(".jpeg") > 0) {
                                    imageObj.type = 0; //jpg
                                } else if (imageObj.url.toLowerCase().indexOf(".png") > 0) {
                                    imageObj.type = 1; //png
                                } else {
                                    imageObj.type = 2; //others
                                }
                                bridgeObj.images.push(imageObj);
                            }
                        }
                        cb(bridgeObj);

                    } catch (e) {
                        console.log(e);
                        cb(bridgeObj);
                    }
                });
            } else if (uri.href.indexOf("http://m.163.com/proxy") >= 0) {
                if (uri.href.toLowerCase().indexOf("url=http://") < 0) {
                    cb(bridgeObj);
                    return;
                }
                var articleStr = uri.href.substr(uri.href.toLowerCase().lastIndexOf("/") + 1).substr(0, uri.href.substr(uri.href.toLowerCase().lastIndexOf("/") + 1).indexOf("."));
                if (articleStr.indexOf("&") >= 0) {
                    articleStr = articleStr.substr(0, articleStr.indexOf("&"));
                }
                var extraUrl = "http://3g.163.com/touch/article/" + articleStr + "/full.html";
                var options = {
                    url: extraUrl,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Linux; Android 4.2.1; en-us; Nexus 4 Build/JOP40D) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.166 Mobile Safari/535.19'
//                    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.52 Safari/537.36'
                    },
                    encoding: null
                };
                request(options, function (err, response, body) {
                    var self = this;
                    if (err && (response && response.statusCode && response.statusCode !== 200)) {
                        console.log('Request error.');
                        cb(bridgeObj);
                        return;
                    }
                    //Send the body param as the HTML code we will parse in jsdom
                    //also tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
                    var contentType = 'utf-8';
                    //console.log(response.headers['content-type']);
                    var cType = response.headers['content-type'].substr(response.headers['content-type'].indexOf("charset") + 8);
//                console.log(cType);
                    if (utilsService.arrayContains(utilsService.knowContentType, cType.toLowerCase())) {
                        contentType = cType;
                    }
                    try {
                        body = iconv.decode(body, contentType);
                        body = body.substring(12);
                        body = body.substring(0, body.length - 1);
                        body = JSON.parse(body);
                        body = body[articleStr];
                        bridgeObj.ret.content = utilsService.filterHtmlTab(body.body);
                        bridgeObj.ret.title = utilsService.filterHtmlTab(body.title);
                        if (body.img && body.img.length > 0) {
                            bridgeObj.images = [];
                            var imageObj = {};
                            imageObj.priority = 10;
                            imageObj.index = -1;
                            imageObj.url = body.img[0].src;
                            if (imageObj.url.toLowerCase().indexOf(".gif") < 0 && imageObj.url.toLowerCase().indexOf(".svg") < 0) {
                                if (imageObj.url.toLowerCase().indexOf(".jpg") > 0 || imageObj.url.toLowerCase().indexOf(".jpeg") > 0) {
                                    imageObj.type = 0; //jpg
                                } else if (imageObj.url.toLowerCase().indexOf(".png") > 0) {
                                    imageObj.type = 1; //png
                                } else {
                                    imageObj.type = 2; //others
                                }
                                bridgeObj.images.push(imageObj);
                            }
                        } else if (body.photoSetList && body.photoSetList.length > 0) {
                            bridgeObj.images = [];
                            var imageObj = {};
                            imageObj.priority = 10;
                            imageObj.index = -1;
                            imageObj.url = body.photoSetList[0].cover;
                            if (imageObj.url.toLowerCase().indexOf(".gif") < 0 && imageObj.url.toLowerCase().indexOf(".svg") < 0) {
                                if (imageObj.url.toLowerCase().indexOf(".jpg") > 0 || imageObj.url.toLowerCase().indexOf(".jpeg") > 0) {
                                    imageObj.type = 0; //jpg
                                } else if (imageObj.url.toLowerCase().indexOf(".png") > 0) {
                                    imageObj.type = 1; //png
                                } else {
                                    imageObj.type = 2; //others
                                }
                                bridgeObj.images.push(imageObj);
                            }
                        }
                        cb(bridgeObj);

                    } catch (e) {
                        console.log(e);
                        cb(bridgeObj);
                    }
                });
            }
            else if (uri.href.indexOf("http://blog.sina.com.cn/s/") >= 0) {
                if ($(".articalContent img").attr("real_src") && $(".articalContent img").attr("real_src").length > 0) {
                    var imageObj = {};
                    imageObj.priority = 10;
                    imageObj.index = -1;
                    imageObj.url = $(".articalContent img").attr("real_src").substr(0, $(".articalContent img").attr("real_src").indexOf("&amp"));
                    bridgeObj.images = [];
                    bridgeObj.images.push(imageObj);
                }
                if ($(".articalContent").html().length > 0) {
                    bridgeObj.ret.content = utilsService.filterHtmlTab($(".articalContent").html());
                }
                cb(bridgeObj);
            } else if (uri.href.indexOf("http://www.acfun.tv/lite/v/") >= 0) {
                if (uri.href.toLowerCase().indexOf("ac=") < 0) {
                    cb(bridgeObj);
                    return;
                }
                var articleStr = uri.href.substr(uri.href.toLowerCase().indexOf("ac=") + 3);
                if (articleStr.indexOf("&") >= 0) {
                    articleStr = articleStr.substr(0, articleStr.indexOf("&"));
                }
                var extraUrl = "http://api.acfun.tv/apiserver/content/info?contentId=" + articleStr;
                console.log(extraUrl);
                var options = {
                    url: extraUrl,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Linux; Android 4.2.1; en-us; Nexus 4 Build/JOP40D) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.166 Mobile Safari/535.19'
//                    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.52 Safari/537.36'
                    },
                    encoding: null
                };
                request(options, function (err, response, body) {
                    var self = this;
                    if (err && (response && response.statusCode && response.statusCode !== 200)) {
                        console.log('Request error.');
                        cb(bridgeObj);
                        return;
                    }
                    //Send the body param as the HTML code we will parse in jsdom
                    //also tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
                    var contentType = 'utf-8';
                    //console.log(response.headers['content-type']);
                    var cType = response.headers['content-type'].substr(response.headers['content-type'].indexOf("charset") + 8);
//                console.log(cType);
                    if (utilsService.arrayContains(utilsService.knowContentType, cType.toLowerCase())) {
                        contentType = cType;
                    }
                    try {
                        body = iconv.decode(body, contentType);
                        body = JSON.parse(body);
                        if (body.data.fullArticle) {
                            bridgeObj.ret.content = utilsService.filterHtmlTab(body.data.fullArticle.txt);
                            bridgeObj.ret.title = utilsService.filterHtmlTab(body.data.fullArticle.title);
                        }
                        if (body.data.fullArticle && body.data.fullArticle.txt && body.data.fullArticle.txt.indexOf("<img") >= 0) {
                            var imgUrls = body.data.fullArticle.txt.match(/<img(.+?)>(.+?) \/>|<img(.+?)\/>|<img(.+?)>/ig);
                            if (imgUrls && imgUrls.length > 0) {
                                for (var iu = 0; iu < imgUrls.length; iu++) {
                                    var url = imgUrls[iu].substr(imgUrls[iu].indexOf("src=\"") + 5).substr(0, imgUrls[iu].substr(imgUrls[iu].indexOf("src=\"") + 5).indexOf("\""))
                                    bridgeObj.images = [];
                                    var imageObj = {};
                                    imageObj.priority = 10;
                                    imageObj.index = -1;
                                    imageObj.url = url;
                                    if (imageObj.url.toLowerCase().indexOf(".gif") < 0 && imageObj.url.toLowerCase().indexOf(".svg") < 0) {
                                        if (imageObj.url.toLowerCase().indexOf(".jpg") > 0 || imageObj.url.toLowerCase().indexOf(".jpeg") > 0) {
                                            imageObj.type = 0; //jpg
                                        } else if (imageObj.url.toLowerCase().indexOf(".png") > 0) {
                                            imageObj.type = 1; //png
                                        } else {
                                            imageObj.type = 2; //others
                                        }
                                        bridgeObj.images.push(imageObj);
                                        iu = imgUrls.length;
                                    }
                                }
                            }
                        }
                        cb(bridgeObj);

                    } catch (e) {
                        console.log(e);
                        cb(bridgeObj);
                    }
                });
            }
            else {
                cb(bridgeObj);
            }
        }

        function getExtraSiteUrl(imagesObjectAfterCalculate) {
            var ret = [];
            if (imagesObjectAfterCalculate && imagesObjectAfterCalculate.length > 0) {
                imagesObjectAfterCalculate.forEach(function (obj) {
                    var rimageObj = {};
                    rimageObj.url = obj.url;
                    rimageObj.priority = obj.priority;
                    ret.push(rimageObj);
                    //console.log(returnImageObj);
                });
                ret.sort(sourImages);
                if (ret[0] && ret[0].priority > 0) {
                    var newRet = [];
                    newRet.unshift(ret[0]);
                    if (ret[1] && ret[1].priority > 8) {
                        newRet.unshift(ret[1]);
                    }
                    if (ret[2] && ret[2].priority > 6) {
                        newRet.unshift(ret[2]);
                    }
                    newRet.sort(sourImages);
                    return newRet;
                } else {
                    if (ret.length > 3) {
                        return ret.slice(0, 3);
                    } else {
                        return ret.slice(0, ret.length);
                    }
                }
            } else {
                return null;
            }
        }

        function getDefaultImages() {
            var ret = [];
            var defaultImages = utilsService.getRandomArray(3, utilsService.defaultImages);
            defaultImages.forEach(function (obj) {
                var imageObj = {};
                imageObj.priority = 10;
                imageObj.url = obj;
                ret.push(imageObj);
            })
            return ret;
        }

        return genNewsObj;
    }

        ()
        )
    ;
module.exports = genNews;