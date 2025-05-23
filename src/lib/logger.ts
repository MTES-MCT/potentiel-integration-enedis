import winston from "winston";

const logger = winston.createLogger({
  transports: [new winston.transports.Console({})],
  format: winston.format.simple(),
  level: "debug",
});

export const getLogger = () => logger;

export type Logger = ReturnType<typeof getLogger>;
