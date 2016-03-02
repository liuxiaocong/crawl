/**
 * Created with JetBrains PhpStorm.
 * User: Administrator
 * Date: 1/5/15
 * Time: 1:37 PM
 * To change this template use File | Settings | File Templates.
 */
var mongoose = require('mongoose');
var utilsService = require("../service/utilsService");
//var autoinc = require('mongoose-id-autoinc');
var mongdb;
if (utilsService.mode == "local") {
    mongdb = mongoose.connect('mongodb://localhost:27017/instamobn');
} else if (utilsService.mode == "dev") {
    mongdb = mongoose.connect('mongodb://192.168.128.125:27017/instamobn?replicaset=instamobn');
} else {
    mongdb = mongoose.connect('mongodb://10.160.240.189:27017/instamobn?replicaset=instamobn');
}

//autoinc.init(mongdb);
function sequenceGenerator(name) {
    var SequenceSchema, Sequence;

    SequenceSchema = new mongoose.Schema({
        nextSeqNumber: { type: Number, default: 1 }
    });

    Sequence = mongoose.model(name + 'Seq', SequenceSchema);

    return {
        next: function (callback) {
            Sequence.find(function (err, data) {
                if (err) {
                    throw(err);
                }

                if (data.length < 1) {
                    // create if doesn't exist create and return first
                    Sequence.create({}, function (err, seq) {
                        if (err) {
                            throw(err);
                        }
                        callback(seq.nextSeqNumber);
                    });
                } else {
                    // update sequence and return next
                    Sequence.findByIdAndUpdate(data[0]._id, { $inc: { nextSeqNumber: 1 } }, function (err, seq) {
                        if (err) {
                            throw(err);
                        }
                        callback(seq.nextSeqNumber);
                    });
                }
            });
        }
    };
}

// sequence instance
var sequence = sequenceGenerator('news');
var newsSchema = new mongoose.Schema({
    id: Number,
    date: String,
    source: String,
    title: String,
    url: String,
    avatar: String,
    hot: Number,
    //type 0 : english , type 1 : chinese
    type: Number
}, {
    //fake
    collection: 'news'
});
newsSchema.pre('save', function (next) {
    var doc = this;
    // get the next sequence
    sequence.next(function (nextSeq) {
        doc.id = nextSeq;
        next();
    });
});
var sequenceGen = sequenceGenerator('gen-history');
var genUrlHistorySchema = new mongoose.Schema({
    id: Number,
    date: String,
    uid: Number,
    cost: Number,
    pagecost: Number,
    source: String,
    url: String,
    retimages: [String],
    retcontent: String,
    rettitle: String
}, {
    //fake
    collection: 'genurlhistory'
});
genUrlHistorySchema.pre('save', function (next) {
    var doc = this;
    // get the next sequence
    sequenceGen.next(function (nextSeq) {
        doc.id = nextSeq;
        next();
    });
});


var sequenceComment = sequenceGenerator('comment');
var commentSchema = new mongoose.Schema({
    id: Number,
    date: String,
    tid: Number,
    user: String,
    content: String
}, {
    //fake
    collection: 'comment'
});
commentSchema.pre('save', function (next) {
    var doc = this;
    // get the next sequence
    sequenceComment.next(function (nextSeq) {
        doc.id = nextSeq;
        next();
    });
});

//newsSchema.plugin(autoinc.plugin, { model: 'news', field: 'id' });

//newsSchema.plugin(autoinc.plugin, { model: 'news',start: 1, step: 1 });

var news = mongdb.model('news', newsSchema);
var genUrlHistory = mongdb.model('genurlhistory', genUrlHistorySchema);
var mdb = (function () {
    var mdbObj = {};
    mdbObj.name = "mdb service";
    mdbObj.addDocument = function (col, doc, cb) {
        var collection = null;
        if (col == "news") {
            collection = mongdb.model(col, newsSchema);
        } else if (col == "genurlhistory") {
            doc.cost = new Date() - doc.cost;
            collection = mongdb.model(col, genUrlHistorySchema);
        }else if (col == "comment") {
            collection = mongdb.model(col, commentSchema);
        }

        try {
            new collection(doc).save(function (err, obj) {
                cb(obj.id)
            });
        } catch (e) {
            cb(-1)
            console.log(e);
        }
//        idg.getNewID(collection, function (newid) {
//            doc.id = newid;
//            console.log(newid);
//            new news(doc).save(cb(newid));
//        });
    }
    mdbObj.findDocument = function (col, condition, cb) {
        var collection = null;
        if (col == "news") {
            collection = mongdb.model(col, newsSchema);
        } else if (col == "genurlhistory") {
            collection = mongdb.model(col, genUrlHistorySchema);
        }
        //console.log(condition);
        collection.find(condition, function (err, doc) {
            cb(doc);
        })

    }
    mdbObj.find = function (col, condition, pn, sz, cb) {
        var collection = null;
        if (col == "news") {
            collection = mongdb.model(col, newsSchema);
        } else if (col == "genurlhistory") {
            collection = mongdb.model(col, genUrlHistorySchema);
        }
        var query = collection.find({});
        if (condition) {
            query.where(condition);
        }
        query.limit(sz);
        query.skip(pn * sz);
        query.sort({'id': -1});
        query.select('-_id -__v');
        query.exec(function (err, docs) {
            cb(docs);
        });
    }
    mdbObj.countCollection = function (col, condition, cb) {
        var collection = null;
        if (col == "news") {
            collection = mongdb.model(col, newsSchema);
        } else if (col == "genurlhistory") {
            collection = mongdb.model(col, genUrlHistorySchema);
        }
        //console.log(condition);
        collection.count(condition, function (err, count) {
            cb(count);
        })
    }
    return mdbObj;
}());

module.exports = mdb;