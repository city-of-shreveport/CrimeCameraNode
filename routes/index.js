//INFO HERE
var express = require('express');
var router = express.Router();

const vids = require('../models/videos');
const cam = require('../models/cameras');
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/allVideos', async (req, res) => {
  vids.find({}, function (err, docs) {
    if (err) {
      console.log(err);
    } else {
      res.send(docs);
    }
  });

  //
});

router.get('/getCamConfig', async (req, res) => {
  cam.find({}, function (err, docs) {
    if (err) {
      console.log(err);
    } else {
      res.send(docs);
    }
  });

  //
});
module.exports = router;
