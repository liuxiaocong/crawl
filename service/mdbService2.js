/**
 * Created with JetBrains PhpStorm.
 * User: Administrator
 * Date: 1/5/15
 * Time: 1:37 PM
 * To change this template use File | Settings | File Templates.
 */
var mongoose = require('mongoose');
//var autoinc = require('mongoose-id-autoinc');
var mdb = mongoose.connect('mongodb://localhost:27017/instamobn');
//autoinc.init(mdb);
var newsSchema = new mongoose.Schema({
    id: Number,
    date: String,
    source: String,
    title: String,
    url: String,
    avatar: String
}, {
    //fake
    collection: 'news'
});
newsSchema.pre('save', function(next){
    var url = this;
    //获得一个新ID
    idg.getNewID('URL',function(newid){
        if(newid){
            url.id = newid;
            next(); //必须的，否则不会保存到mongo哦！
        }
    });
});
mongoose.model('news', newsSchema);
//newsSchema.plugin(autoinc.plugin, { model: 'news',start: 1, step: 1 });
var IdGenerator = new mongoose.Schema({
    modelname: { type: String },
    currentid: { type: Number, default: 1 }
});
mongoose.model('ids', IdGenerator);
var idg = mongoose.model('ids');
idg.getNewID = function (modelName, callback) {
    this.findOne({modelname: modelName}, function (err, doc) {
        if (doc) {
            doc.currentid += 1;
        } else {
            doc = new idg();
            doc.modelname = modelName;
        }
        doc.save(function (err) {
            if (err) throw err('IdGenerator.getNewID.save() error');
            else callback(parseInt(doc.currentid.toString()));
        });
    });
}

var news = mongoose.model('news');
var mdb = (function () {
    var mdbObj = {};
    mdbObj.name = "mdb service";
    mdbObj.addDocument = function (collection, doc, cb) {
        new news(doc).save(cb(doc.id));
//        idg.getNewID(collection, function (newid) {
//            doc.id = newid;
//            console.log(newid);
//            new news(doc).save(cb(newid));
//        });
    }
    return mdbObj;
}());

module.exports = mdb;