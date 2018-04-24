var express = require('express');
var router = express.Router();
var db = require('sharedb-mongo')('mongodb://localhost:27017/test');
var ShareDB = require('sharedb');
var backend = new ShareDB({db});

function createDoc(callback) {
    var connection = backend.connect();
    var doc = connection.get('test', 'runoob');
    doc.fetch(function(err) {
        if (err) throw err;
        console.log('get error: ', err);
        if (doc.type === null) {
            doc.create({numClicks: 0}, callback);
            return;
        }
        callback();
    });
    console.log('get doc: ', doc);
}
/* GET home page. */
router.get('/', function(req, res, next) {
  var connection = backend.connect();
  var doc = connection.get('COEDITOR', 'FOLDER1FILE1');
  doc.fetch(function(err) {
      console.log(doc);
  });
  res.render('index', { title: 'Express', db: db });
});

module.exports = router;
