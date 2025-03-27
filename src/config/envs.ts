import * as joi from 'joi';
// import * as dotenv from 'dotenv';
// dotenv.config();

interface Envvars {
  NATS_SERVERS: string[];
  DB_URI: string;
}

const envVarsSchema = joi
  .object({
    NATS_SERVERS: joi.array().items(joi.string()).required(),
    DB_URI: joi.string().required(),
  })
  .unknown(true);

const { error, value } = envVarsSchema.validate({
  ...process.env,
  NATS_SERVERS: process.env.NATS_SERVERS?.split(','),
});

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: Envvars = value;

export const envs = {
  natsServers: envVars.NATS_SERVERS,
  dbUri: envVars.DB_URI,
};
