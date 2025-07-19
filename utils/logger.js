import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log formats
const { combine, timestamp, printf, colorize } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  const metaString = Object.keys(metadata).length ? JSON.stringify(metadata) : '';
  return `${timestamp} [${level}]: ${message} ${metaString}`;
});

// Custom format for file output (without colors)
const fileFormat = printf(({ level, message, timestamp, ...metadata }) => {
  const metaString = Object.keys(metadata).length ? JSON.stringify(metadata) : '';
  return `${timestamp} [${level}]: ${message} ${metaString}`;
});

// Create daily rotate file transports
const apiTransport = new winston.transports.DailyRotateFile({
  filename: path.join(__dirname, '../logs/api-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'http'
});

const errorTransport = new winston.transports.DailyRotateFile({
  filename: path.join(__dirname, '../logs/error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'error'
});

// Create logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'apex-biotics-api' },
  transports: [
    // Console transport with colorization for development
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      )
    }),
    // File transports
    apiTransport,
    errorTransport
  ]
});

// Create morgan stream function for express
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

export default logger; 