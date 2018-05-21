const express = require('express');
const config = require('../config');
const ShareDB = require('sharedb');
const db = require('sharedb-mongo')(config.database);
const router = express.Router();
const backend = new ShareDB({db});

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
  res.render('index', { title: 'Express', db: db });
});

module.exports = router;
