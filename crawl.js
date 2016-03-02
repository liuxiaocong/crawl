var express = require('express');
var domain = require('domain');
var app = express();
var crawlRoute = require('./routes/crawlRoute');
var funRoute = require('./routes/funRoute');
var apiRoute = require('./routes/apiRoute');
var bodyParser = require('body-parser');
var multer = require('multer');
var timeout = require('connect-timeout');

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
            res.status(500).send(JSON.stringify(ret));
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
var server = app.listen(9025, function () {
    var host = server.address().address
    var port = server.address().port
    console.log('Example app listening at http://%s:%s', host, port)

})
