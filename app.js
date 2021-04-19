// basic requires
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

app.get('/back_yard.m3u8', (req, res) => {
  if (mp4frag.m3u8) {
    res.writeHead(200, { 'Content-Type': 'application/vnd.apple.mpegurl' });
    res.end(mp4frag.m3u8);
  } else {
    res.sendStatus(503); //todo maybe send 400
  }
});

app.get('/init-back_yard.mp4', (req, res) => {
  if (mp4frag.initialization) {
    res.writeHead(200, { 'Content-Type': 'video/mp4' });
    res.end(mp4frag.initialization);
  } else {
    res.sendStatus(503);
  }
});

app.get('/back_yard:id.m4s', (req, res) => {
  const segment = mp4frag.getSegment(req.params.id);
  if (segment) {
    res.writeHead(200, { 'Content-Type': 'video/mp4' });
    res.end(segment);
  } else {
    res.sendStatus(503);
  }
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
