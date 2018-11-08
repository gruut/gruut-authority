const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const accessLogger = require('morgan');
require('winston-daily-rotate-file');
const rfs = require('rotating-file-stream');
const winston = require('winston');
const fs = require('fs');
const cert = require('./utils/cert');
const { sequelize } = require('./models');
const indexRouter = require('./routes/index');
const v1 = require('./routes/v1');

const app = express();
app.set('port', process.env.PORT || 48080);

// eslint-disable-next-line new-cap
const transport = new (winston.transports.DailyRotateFile)({
  filename: path.join('/tmp/log/error', 'ga-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
});

const errorLogger = winston.createLogger({
  format: winston.format.combine(winston.format.json(), winston.format.timestamp()),
  transports: [
    transport,
  ],
});

// set global variable
cert.generateKeyPair();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

if (process.env.NODE_ENV === 'production') {
  const accessLogStream = rfs('access.log', {
    interval: '14d',
    path: path.join('/tmp/log', 'access'),
  });

  app.use(accessLogger('combined', { stream: accessLogStream }));
} else {
  const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
  app.use(accessLogger('combined', { stream: accessLogStream }));
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', indexRouter);
app.use('/v1', v1);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const errorMsg = `Headers: ${JSON.stringify(req.headers)} Body: ${JSON.stringify(req.body)}`;

  errorLogger.log({
    level: 'warn',
    message: errorMsg,
  });
  next(createError(404));
});

// error handler
app.use((err, req, res) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  errorLogger.log({
    level: 'error',
    message: `Error: ${err.message}
    Stack: ${JSON.stringify(err.stack)}`,
  });

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(app.get('port'), () => {
  errorLogger.log({
    level: 'info',
    message: `PORT: ${app.get('port')}`,
  });
});


module.exports = app;
