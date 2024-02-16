import 'dotenv/config';
import { readFileSync } from 'node:fs';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import filterXSS from 'xss';
import AI from './ai.js';
import logger from './logger.js';
import db from './db.js';
import auth from './auth.js';
import {
  BAD_REQUEST,
  RESULT_NOT_FOUND,
  INTERNAL_SERVER_ERROR,
  UNAUTHORIZED,
} from './error.js';

const openapiYaml = readFileSync('./resources/openapi.yaml', 'utf8');
const swaggerDocument = YAML.parse(openapiYaml);

const server = express();
server.use(express.json());

// Setup authentication middleware
const authMiddleware = (req, res, next) => {
  if (!auth.verify(req)) {
    res.status(401).json(UNAUTHORIZED);
    return;
  }
  next();
};

// Add OpenAPI Swagger documentation
const swaggerOptions = {
  url: '/api-docs/openapi.yaml',
};
const mountSwagger = (req, _res, next) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  swaggerDocument.servers[0].url = `${protocol}://${req.get('host')}`;
  server.use('/api-docs/openapi.yaml', (_req, res) => {
    res.set('Content-Type', 'text/yaml');
    res.send(YAML.stringify(swaggerDocument));
  });
  server.use(
    '/api-docs',
    swaggerUi.serveFiles(null, {
      swaggerOptions,
    }),
    swaggerUi.setup(null, {
      swaggerOptions,
    })
  );
  next();
};
server.use(mountSwagger);

// Add a redirect to the OpenAPI Swagger documentation
server.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// Add a route to handle the /search endpoint
server.post('/search', authMiddleware, async (req, res) => {
  logger.info(`Request to /search received: ${req.body.message}`);
  if (req.body.message == null || req.body.message === '') {
    res.status(400).json(BAD_REQUEST);
    return;
  }

  try {
    const userPrompt = req.body.message;
    const sql = await AI.craftQuery(userPrompt);
    logger.info(`craftQuery response sql: ${sql}`);

    let rows = [];
    try {
      rows = await db.query(sql);
    } catch (error) {
      logger.info(`db.query error: ${error.message}`);
      res.status(404).json(RESULT_NOT_FOUND);
      return;
    }

    if (!Array.isArray(rows)) {
      res.status(404).json(RESULT_NOT_FOUND);
      return;
    }

    const resultsDescribed = await AI.processResult(userPrompt, sql, rows);

    logger.info(`results described: ${resultsDescribed}`);
    res.json({ message: filterXSS(resultsDescribed) });
  } catch (error) {
    const newError = { ...INTERNAL_SERVER_ERROR, message: error.message };
    res.status(500).json(newError);
  }
});

export default server;
