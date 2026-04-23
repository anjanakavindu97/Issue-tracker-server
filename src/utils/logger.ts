import { createLogger, format, transports } from 'winston';

const { combine, timestamp, colorize, printf, splat } = format;

const cyan = (text: string) => `\x1b[36m${text}\x1b[0m`;
const yellow = (text: string) => `\x1b[33m${text}\x1b[0m`;
const red = (text: string) => `\x1b[31m${text}\x1b[0m`;
const green = (text: string) => `\x1b[32m${text}\x1b[0m`;
const blue = (text: string) => `\x1b[34m${text}\x1b[0m`;
const magenta = (text: string) => `\x1b[35m${text}\x1b[0m`;
const white = (text: string) => `\x1b[37m${text}\x1b[0m`;
const gray = (text: string) => `\x1b[90m${text}\x1b[0m`;

const logFormat = printf(({ level, message, timestamp, [Symbol.for('splat')]: splatArgs, ...meta }) => {
  const extras: unknown[] = (splatArgs as unknown[]) ?? (Object.keys(meta).length ? [meta] : []);
  const metaStr = extras.length
    ? '\n' + extras.map((e) => JSON.stringify(e, null, 2)).join('\n')
    : '';
  return `[${yellow(String(timestamp))}] ${level}: ${magenta(String(message))}${cyan(String(metaStr))}`;
});

const logger = createLogger({
  level: 'info',
  format: combine(
    splat(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    colorize(),
    logFormat,
  ),
  transports: [new transports.Console()],
});

export default logger;
