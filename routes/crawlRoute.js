var express = require('express');
var router = express.Router();
var crawlService = require('../service/crawlService');
var sourceObj = {
    "stomp": "http://singaporeseen.stomp.com.sg/singaporeseen/category/hot-topics",
    "asiaone": "http://news.asiaone.com/news/singapore",
    "trs": "http://therealsingapore.com/category/editorials",
    "channel8": "http://www.channel8news.sg/mobile8/latestnews",
    "localNews": "http://news.omy.sg/News/Local%20News/page/1/0",
    "NanYangView": "http://sg.nanyangpost.com/search/label/Singapore",
    "wangyi": "http://news.163.com/rank/",
    "kr": "http://36kr.com",
    "zhihu":"http://www.zhihu.com/explore",
    "huxiu":"http://www.huxiu.com",
    "cnalky": "http://www.channelnewsasia.com/news/specialreports/rememberingleekuanyew/news"

}
var mutilpleRequest = 0;
/* GET users listing. */
router.get('/', function (req, res) {
    res.render('instamob/index');
});
router.get('/crawlNews', function (req, res) {
    mutilpleRequest++;
    res.sourceAccount = 2;
    res.finishCrawl = 0;
    res.detect = function (data) {
        if (res.sourceAccount == res.finishCrawl) {
            res.end(JSON.stringify(data));
        }
    }
    //fake
//    res.sourceAccount = 1;
//    crawlService.getChannelE(res, sourceObj);
    //end fake
    if (mutilpleRequest % 2 == 0) {
        console.log("getChannelE getStomp getAsiaOne getTrs:" + mutilpleRequest);
        res.sourceAccount = 2;
//      crawlService.getChannelE(res, sourceObj);
//      crawlService.getStomp(res, sourceObj);
        crawlService.getAsiaOne(res, sourceObj);
//      crawlService.getTrs(res, sourceObj);
	    crawlService.getZhihu(res, sourceObj);
    } else {
        console.log("getLocalNews getNanYangView getWangyi getKr:" + mutilpleRequest);
        res.sourceAccount = 2;
        crawlService.getLocalNews(res, sourceObj);
        crawlService.getNanYangView(res, sourceObj);
//      crawlService.getWangyi(res, sourceObj);
//      crawlService.getKr(res, sourceObj);
//      crawlService.getHuxiu(res, sourceObj);
    }
});
module.exports = router;
