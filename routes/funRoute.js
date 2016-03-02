var express = require('express');
var router = express.Router();

/* GET users listing. */
//router.get('/', function(req, res) {
//  res.send('respond with a resource');
//});
var mdbService = require("../service/mdbService");
var utilsService = require("../service/utilsService");
router.get('/', function(req, res) {
    console.log("list");
    console.log(req.query);
    var query = req.query;
    var condition = {};
    if (query.type) {
        condition.type = query.type;
    }
    console.log(query.source);
    if (query.source) {
        condition.source = query.source;
    }
    if(condition == {}) condition = null;
    mdbService.countCollection("news",condition,function(count)
    {
        console.log(count);
        count = parseInt(count/20) + 1;
        res.render('list',{"count":count,"type":query.type,"source":query.source});
    })
});
router.get('/gennews', function(req, res) {
    res.render('genfromurl',{"count":1,"type":1,"source":1});
});
router.get('/gennewshistory', function(req, res) {
    var query = req.query;
    var condition = {};
    if (query.source) {
        condition.source = query.source;
    }
    if(condition == {}) condition = null;
    mdbService.countCollection("genurlhistory",condition,function(count)
    {
        console.log(count);
        count = parseInt(count/20) + 1;
        res.render('gennewshistory',{"count":count,"source":query.source});
    })
});

router.get('/ditools', function(req, res) {
    res.render('ditools',{"count":1,"type":1,"source":1});
});

module.exports = router;
