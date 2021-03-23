var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
 res.render('management', {
       title : 'Crime Cam Management', 
       layout : 'management_index.pug'
});
});



module.exports = router;