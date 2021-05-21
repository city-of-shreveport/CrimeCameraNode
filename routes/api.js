const Express = require('express');
const Router = Express.Router();
const Videos = require('../models/videos');

Router.get('/allVideos', async (req, res) => {
  Videos.find({}, function (err, docs) {
    if (err) {
      console.log(err);
      res.send('error');
    } else {
      res.send(docs);
    }
  });
});

module.exports = Router;
