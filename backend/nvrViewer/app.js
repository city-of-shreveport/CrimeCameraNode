var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var cameras = require('./routes/cameras')
var perfmon = require('./routes/perfmon')
var management = require('./routes/management');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/cameras', cameras);
app.use('/perfmon', perfmon);
app.use('/management', management);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
var request = require('request');
var user
function getStreams(){
  console.log("yup")
  request.get(
    
    "http://192.168.196.75:8080/"+ user.auth_token  +"/videos/eGjcwkXXPo/DBxQdxYYak80",
    
    function (error, response, d) {
        if (!error && response.statusCode == 200) {
          var jsonObj = JSON.parse(d);
          console.log(jsonObj.videos)
            for(i=0;i<jsonObj.videos.length;i++){
              console.log(jsonObj.videos[i].filename);

            }
            
        }
        if(error){
          console.log(error)
  
  
        }
    }
  );


}
//request.post(
  //  'http://192.168.196.75:8080/?json=true',
    //{ json: { machineID: "fMUVxYdG1X3hWb7GNkTd", mail: "talk2dug@gmail.com", pass: "UUnv9njxg123", function: "dash"} },
//    function (error, response, d) {
 //       if (!error && response.statusCode == 200) {
 //           console.log(d.$user);
 //            user = d.$user
 //            getStreams()
           
  //      }
   //     if(error){
     //     console.log(error)


       // }
  //  }
//);


module.exports = app;
