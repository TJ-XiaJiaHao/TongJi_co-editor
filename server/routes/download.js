const express = require('express');
const router = express.Router();
const fs = require('fs');
const url = require('url');
const ERROR = require('../model/ERROR');
const Project = require('../dao/project');
/* GET home page. */
router.get('/', function(req, res) {
  const projectId =  url.parse(req.url, true).query.projectId;
  if (!projectId) res.json(ERROR.ARGUMENTS_ERROR);
  else Project.download(projectId, (data) => {
    if (data.code === 0) {
      fs.writeFile(data.zipName, data.content, 'binary', function () {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats');
        res.setHeader('Content-Disposition', 'attachment; filename=test.zip');
        res.end(fs.readFileSync(data.zipName), 'binary');
        fs.unlinkSync(data.zipName);
      });
    }
  });
});

module.exports = router;
