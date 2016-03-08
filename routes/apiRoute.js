var express = require('express');
var router = express.Router();
var extend = require('util')._extend;
var request = require('request');
var iconv = require('iconv-lite');
/* GET users listing. */
//router.get('/', function(req, res) {
//  res.send('respond with a resource');
//});
var mdbService = require("../service/mdbService");
var utilsService = require("../service/utilsService");
var genNewsService = require("../service/genNewsService");

var toolsService = require("../service/toolsService");

router.all('/getNewsList', function(req, res) {
	console.log("list");
	console.log(req.body);
	var query = req.body;
	var condition = {};
	if (query.lang && !query.source) {
		if (query.lang == "zh") {
			condition.type = 1;
		}else{
			condition.type = 0;
		}
	}
	console.log(query.source);
	if (query.source) {
		condition.source = query.source;
	}
	if (condition == {}) condition = null;
	mdbService.find("news", condition, query.index, query.count, function(docs) {
		console.log("docs");
		var data = {};
		var newDocs = [];
		[].forEach.call(docs, function(doc, index, array) {
			//readFileSync
			try {
				var doc2 = JSON.parse(JSON.stringify(doc));
				if (query.content && query.content == "true") {
					doc2.content = utilsService.getNewsContentSync(doc.id);
				}
				if (query.comment && query.comment == "true") {
					doc2.comment = utilsService.getComments(doc.id);
				}
				if (doc2.avatar.toLowerCase().indexOf(".png") > 0) {
					doc2.avatar = utilsService.selfUrl + "news" + "/" + doc2.id + "/" + "thumbnail.png";
				} else if (doc2.avatar.toLowerCase().indexOf(".jpeg") > 0) {
					doc2.avatar = utilsService.selfUrl + "news" + "/" + doc2.id + "/" + "thumbnail.jpeg";
				} else if (doc2.avatar.toLowerCase().indexOf(".gif") > 0) {
					doc2.avatar = utilsService.selfUrl + "news" + "/" + doc2.id + "/" + "thumbnail.gif";
				} else {
					doc2.avatar = utilsService.selfUrl + "news" + "/" + doc2.id + "/" + "thumbnail.jpg";
				}
				//                console.log(doc2);
				newDocs.push(doc2);
			} catch (e) {
				console.log(e);
			}
		});
		data.data = newDocs;
		res.end(JSON.stringify(data));
	})
});
router.get('/getSourceList', function(req, res) {
	var query = req.query;
	var data = ["stomp", "asiaone", "trs", "channel8", "localNews", "南洋视界", "网易", "36kr", "知乎", "联合早报", "我报", "新明日报"];
	if (query.lang && query.lang == "en") {
		data = ["stomp", "asiaone", "trs"];
	} else if (query.lang && query.lang == "zh") {
		data = ["channel8", "localNews", "南洋视界", "网易", "36kr", "知乎", "联合早报", "我报", "新明日报"];
	}
	res.set({
		'content-type': 'text/json; charset=utf-8'
	})
	res.end(JSON.stringify(data));
});

router.post('/postSourceList', function(req, res) {
	var query = req.query;
	var data = ["post", "stomp", "asiaone", "trs", "channel8", "localNews", "南洋视界", "网易", "36kr", "知乎", "联合早报", "我报", "新明日报"];
	if (query.lang && query.lang == "en") {
		data = ["stomp", "asiaone", "trs"];
	} else if (query.lang && query.lang == "zh") {
		data = ["channel8", "localNews", "南洋视界", "网易", "36kr", "知乎", "联合早报", "我报", "新明日报"];
	}
	res.set({
		'content-type': 'text/json; charset=utf-8'
	})
	res.end(JSON.stringify(data));
});

router.get('/getGenHistoryList', function(req, res) {
	console.log("list");
	console.log(req.query);
	var query = req.query;
	var condition = {};
	if (query.source) {
		condition.source = query.source;
	}
	if (condition == {}) condition = null;
	mdbService.find("genurlhistory", condition, req.query.pn, req.query.sz, function(docs) {
		console.log("docs");
		var data = {};
		var newDocs = [];
		[].forEach.call(docs, function(doc, index, array) {
			//readFileSync
			try {
				var doc2 = JSON.parse(JSON.stringify(doc));
				//                console.log(doc2);
				newDocs.push(doc2);
			} catch (e) {
				console.log(e);
			}
		});
		data.data = newDocs;
		res.set({
				'content-type': 'text/json; charset=utf-8'
			})
			//res.end("{\"aaaa\":\"cc\"}");
			//        console.log(JSON.stringify(data));
		res.end(JSON.stringify(data));
	})
});


router.get('/getNewsContent', function(req, res) {
	console.log("content");
	console.log(req.query);
	var id = req.query.id;
	utilsService.getNewsContent(id, function(content) {
		var ret = {};
		ret.content = content;
		res.end(JSON.stringify(ret));
	})
});
router.get('/genNews', function(req, res) {
	var ret = {};
	ret.imgs = [];
	ret.title = "";
	ret.content = "";
	var query = req.query;
	//    console.log(req.body);
	var url = query.url;
	var uid = query.id;
	if (!url) {
		var ret = {};
		ret.code = -2;
		res.status(500).send(JSON.stringify(ret));
		return;
	}
	if (!uid) {
		uid = "100001";
	}
	if (url.indexOf("http") != 0) {
		url = "http://" + url;
	}
	genNewsService.genNewsFromUrl(res, uid, url);
	//    req.pipe(request("http://172.28.2.70:8080/crawl.instamob.im/crawl/?action=getnewslist&controller=api")).pipe(res);
})

router.post('/genNews', function(req, res) {
	var ret = {};
	ret.imgs = [];
	ret.title = "";
	ret.content = "";
	var query = req.body;
	var url = query.url;
	var uid = query.id;
	if (!url) {
		var ret = {};
		ret.code = -2;
		res.status(500).send(JSON.stringify(ret));
		return;
	}
	if (!uid) {
		uid = "100001";
	}
	if (url.indexOf("http") != 0) {
		url = "http://" + url;
	}
	genNewsService.genNewsFromUrl(res, uid, url);
	//    req.pipe(request("http://172.28.2.70:8080/crawl.instamob.im/crawl/?action=getnewslist&controller=api")).pipe(res);
})

router.get('/test', function(req, res) {
	var ret = {};
	ret.data = [];
	for (var i = 1; i < 128; i++) {
		var url = "http://comment.news.163.com/cache/newlist/news3_bbs/AHMVUTIU00014SEH_" + i + ".html";
		console.log(url);
		var options = {
			url: url,
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.52 Safari/537.36'
			},
			encoding: null
		};
		request(options, function(err, response, body) {
			var self = this;
			self.items = new Array(); //I feel like I want to save my results in an array

			//Just a basic error check
			if (err && (response && response.statusCode && response.statusCode !== 200)) {
				console.log('Request error.');
			}
			body = iconv.decode(body, 'utf-8');
			var content = body.substr(body.indexOf("={") + 1).substr(0, body.substr(body.indexOf("={") + 1).length - 2);
			try {
				console.log(content);
				content = JSON.parse(content);
				content.newPosts.forEach(function(obj) {
					var comment = {};
					comment.content = obj[1].b;
					comment.cnlength = comment.content.match(/[^ -~]/g) == null ? comment.content.length : comment.content.length + comment.content.match(/[^ -~]/g).length;
					comment.length = comment.content.length;
					ret.data.push(comment);
				})
				if (ret.data.length >= 3000) {
					res.end(JSON.stringify(ret));
				}
			} catch (e) {}
		}).on("error", function(err) {
			console.log(err);
		});
	}
	//    ret.count = 1;
	//    res.end(JSON.stringify(ret));
	//    req.pipe(request("http://172.28.2.70:8080/crawl.instamob.im/crawl/?action=getnewslist&controller=api")).pipe(res);
})

router.post('/gendicode', function(req, res) {
	var query = req.query;
	var url = req.body.url;

	console.log(url);

	var data = {};
	data.result = toolsService.getCodeFromContent(res, url);

});
module.exports = router;