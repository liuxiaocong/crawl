var express = require('express');
var domain = require('domain');
var app = express();
var crawlRoute = require('./routes/crawlRoute');
var funRoute = require('./routes/funRoute');
var apiRoute = require('./routes/apiRoute');
var bodyParser = require('body-parser');
var multer = require('multer');
var timeout = require('connect-timeout');
var mdbService = require("./service/mdbService");
var utilsService = require("./service/utilsService");
//var testRoute = require('./routes/testRoute');
app.listen(3000);
app.set('view engine', 'ejs');
app.use(bodyParser.json({limit: '1mb'}));  //body-parser 解析json格式数据
app.use(bodyParser.urlencoded({            //此项必须在 bodyParser.json 下面,为参数编码
    extended: true
}));

//app.use('/test', testRoute);
app.use(express.static(__dirname + '/public'));
app.use(function (req, res, next) {
    var reqDomain = domain.create();
    reqDomain.on('error', function () {
        try {
            var killTimer = setTimeout(function () {
                process.exit(1);
            }, 30000);
            killTimer.unref();
            server.close();
            var ret = {};
            ret.code = -1;
            if(res!=null)
            {
            	res.status(500).send(JSON.stringify(ret));
            }
        } catch (e) {
            console.log('error when exit', e.stack);
        }
    });
    reqDomain.run(next);
});
process.on('uncaughtException', function (err) {
    console.log("process error:" + err);
//    try {
//        var killTimer = setTimeout(function () {
//            process.exit(1);
//        }, 30000);
//        killTimer.unref();
//        server.close();
//    } catch (e) {
//        console.log('error when exit', e.stack);
//    }
});
//app.use(timeout(1000));
//app.use(haltOnTimedout);
//function haltOnTimedout(req, res, next) {
//    if (!req.timedout) {
//        next();
//    }else
//    {
//        res.end("time out");
//    }
//}
app.use('/', crawlRoute);
app.use('/list', funRoute);
app.use('/functions', funRoute);
app.use('/api', apiRoute);
app.get('/news', function (req, res) {
    res.render('instamob/newslist');
})
app.get('/share', function (req, res) {
    var tid = 1;
    var nid = 1;
    if (req.query) {
        if (req.query.tid) tid = req.query.tid;
        if (req.query.nid) nid = req.query.nid;
    }
    var condition = {};
    var time = "2 hour ago";
    condition.id = nid;
    condition.type = tid;
    console.log(condition);
    mdbService.find("news", condition,0,1, function (docs) {
        console.log("docs");
        var data = {};
        var newDocs = [];
        console.log(docs);
        var title = "Instamob - discuss the hottest Singapore news with no restraints.";
        var image = "http://instamob.im/images/og.png";
        if(docs!=null && docs.length > 0)
        {
        	title = docs[0].title;
        	image = docs[0].avatar;
        	time = utilsService.getTimeTextFrom(docs[0].date);	
        }
        var content = 
        console.log(title);
        console.log(image);
        utilsService.getNewsContent(nid,function(content)
        {
        	console.log(content);
        	res.render('instamob/share',{"title":title,"image":image,"nid":nid,"content":content,"time":time});
        })
        
    })
//  request.post({uri: utilsService.serverApi + "/call", body: '{"CMD":2,"userId":99999,"service":"INSTMOB_NEWS","request":{"req_get_news_detail":{"topic_id":' + tid + ',"news_id":' + nid + '}}}'}, function (err, response, body) {
//      var ret = JSON.parse(body);
//      var title = "Instamob - discuss the hottest Singapore news with no restraints.";
//      var image = "http://instamob.im/images/og.png";
//
//      if(ret.resp_get_news_detail.news_info.title && ret.resp_get_news_detail.news_info.images)
//      {
//          title = ret.resp_get_news_detail.news_info.title;
//          image = ret.resp_get_news_detail.news_info.images[0];
//      }
//      res.render('instamob/share',{"title":title,"image":image});
//  })
})
var server = app.listen(9025, function () {
    var host = server.address().address
    var port = server.address().port
    console.log('Example app listening at http://%s:%s', host, port)

})
