import {
  createLogger,
  format as _format,
  transports as _transports,
} from 'winston';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: _format.combine(
    _format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    _format.errors({ stack: true }),
    _format.json()
  ),
  defaultMeta: { service: 'acquisitions-api' },
  transports: [
    //
    // - Write all logs with importance level of `error` or higher to `error.log`
    //   (i.e., error, fatal, but not other levels)
    //
    new _transports.File({ filename: 'logs/error.log', level: 'error' }),
    //
    // - Write all logs with importance level of `info` or higher to `combined.log`
    //   (i.e., fatal, error, warn, and info, but not trace)
    //
    new _transports.File({ filename: 'logs/combined.log' }),
  ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new _transports.Console({
      format: _format.combine(_format.colorize(), _format.simple()),
    })
  );
}

export default logger;
