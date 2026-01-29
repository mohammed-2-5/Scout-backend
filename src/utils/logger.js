const winston = require('winston');
const path = require('path');
require('winston-daily-rotate-file');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat
  }),

  // Error log file - rotates daily, keeps for 30 days
  new winston.transports.DailyRotateFile({
    filename: path.join('logs', 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: format,
    maxFiles: '30d',
    maxSize: '20m'
  }),

  // Combined log file - all logs, rotates daily
  new winston.transports.DailyRotateFile({
    filename: path.join('logs', 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: format,
    maxFiles: '14d',
    maxSize: '20m'
  }),

  // HTTP requests log
  new winston.transports.DailyRotateFile({
    filename: path.join('logs', 'http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    format: format,
    maxFiles: '7d',
    maxSize: '20m'
  })
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports
});

// Create a stream object for Morgan (HTTP request logging)
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

module.exports = logger;
