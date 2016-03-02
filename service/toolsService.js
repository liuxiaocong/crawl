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
var tools = (function () {
    var toolsObj = {};

    toolsObj.getServiceName = function (res, url) {
        return "tools";
    };

    toolsObj.getCodeFromUrl = function (res, url) {
        console.log("Start");

        var ua = 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.52 Safari/537.36';
        var options = {
            url: url,
            headers: {
//                'User-Agent': 'Mozilla/5.0 (Linux; Android 4.2.1; en-us; Nexus 4 Build/JOP40D) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.166 Mobile Safari/535.19'
                'User-Agent': ua
            },
            encoding: null
        };

        console.log(url);
        var ret = {};
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
            body = iconv.decode(body, contentType);

            body = url;

            var $ = cheerio.load(body, {decodeEntities: false});
            var trs = $(".table-wrap tbody").find("tr");
            var result = "";

            //static final int ID_ME_PROFILE_EDIT_NAME = 15118;
            trs.each(function () {
                result = result + "static final int ID_" + $(this).find("td").eq(2).text().toUpperCase().replace(/\./ig, "_") + " = " + $(this).find("td").eq(0).text() + ";";
            });
            ret.result = result;
            console.log(ret);
            res.end(JSON.stringify(ret));
        });
    };


    toolsObj.getCodeFromContent = function (res, content) {
        console.log("Start");
        var ret = {};

        var $ = cheerio.load(content, {decodeEntities: false});
        var trs = $(".table-wrap tbody").find("tr");
        var result = "";

        //static final int ID_ME_PROFILE_EDIT_NAME = 15118;
        trs.each(function () {
            result = result + "static final int ID_" + $(this).find("td").eq(2).text().toUpperCase().replace(/\./ig, "_") + " = " + $(this).find("td").eq(0).text() + ";";
        });
        ret.result = result;
        console.log(ret);
        res.end(JSON.stringify(ret));

    };

    toolsObj.genDICode = function (res, url) {
        return 123;
    };
    return toolsObj;
})();

module.exports = tools;