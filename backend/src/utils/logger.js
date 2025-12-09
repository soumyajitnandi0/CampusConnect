const config = require('../config');

class Logger {
  constructor() {
    this.isDevelopment = config.nodeEnv === 'development';
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${metaStr}`;
  }

  info(message, meta = {}) {
    console.log(this.formatMessage('info', message, meta));
  }

  error(message, error = null, meta = {}) {
    const errorMeta = error
      ? {
          ...meta,
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
        }
      : meta;
    console.error(this.formatMessage('error', message, errorMeta));
  }

  warn(message, meta = {}) {
    console.warn(this.formatMessage('warn', message, meta));
  }

  debug(message, meta = {}) {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, meta));
    }
  }
}

module.exports = new Logger();


