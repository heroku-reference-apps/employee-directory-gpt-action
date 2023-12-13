import 'dotenv/config'
import { readFileSync } from 'node:fs'
import express from 'express'
import swaggerUi from 'swagger-ui-express'
import cors from 'cors'
import YAML from 'yaml'
import openAI from './openAI.js'
import logger from './logger.js'
import db from './db.js'
import auth from './auth.js'

const RESULT_NOT_FOUND = 'Sorry. I was unable to track down what you were looking for.'
const UNAUTHORIZED = 'Using bearer auth. Plugin service level key was either not provided or incorrect.'

const openapiYaml = readFileSync('./.well-known/openapi.yaml', 'utf8')
const swaggerDocument = YAML.parse(openapiYaml)

const server = express()
server.use(cors({
  origin: 'https://chat.openai.com',
  methods: ['GET', 'POST', 'OPTIONS']
}))
server.use(express.json())

server.get('/.well-known/ai-plugin.json', (req, res) => {
  const baseUrl = `https://${req.get('host')}`
  res.json({
    schema_version: 'v1',
    name_for_human: 'Employee Directory Lookup',
    name_for_model: 'employee_lookup',
    description_for_human: "Search the employee directory with a natural language description of what you're looking for.",
    description_for_model: 'Help the user query the company employee directory.',
    auth: {
      type: 'service_http',
      authorization_type: 'bearer',
      verification_tokens: {
        openai: process.env.OPENAI_GENERATED_ACCESS_TOKEN
      }
    },
    api: {
      type: 'openapi',
      url: `${baseUrl}/.well-known/openapi.yaml`
    },
    logo_url: `${baseUrl}/.well-known/logo.png`,
    contact_email: 'REPLACE_ME@example.com',
    legal_info_url: `${baseUrl}/.well-known/legal.html`
  })
})

server.use('/.well-known', express.static('.well-known'))

const authMiddleware = async (req, res, next) => {
  if (auth.verify(req)) {
    next()
  } else {
    res.status(401).send(UNAUTHORIZED)
  }
}

server.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
server.get('/', (req, res) => {
  res.redirect('/api-docs')
})
server.post('/search', authMiddleware, async (req, res) => {
  logger.info(`Request to / received: ${req.body.message}`)
  if ((typeof req.body.message) === 'undefined' || !req.body.message.length) {
    res.status(400).json({ error: 'No query provided in "message" key of payload.' })
    return
  }
  try {
    const userPrompt = req.body.message
    const sql = await openAI.craftQuery(userPrompt)
    logger.info(`craftQuery response sql: ${sql}`)

    let rows = []
    try {
      rows = await db.query(sql)
    } catch (error) {
      logger.info(`db.query error: ${error.message}`)
      res.send(RESULT_NOT_FOUND)
      return
    }

    if (!Array.isArray(rows)) {
      res.send(RESULT_NOT_FOUND)
      return
    }

    const resultsDescribed = await openAI.processResult(userPrompt, sql, rows)

    logger.info(`results described: ${resultsDescribed}`)
    res.send(resultsDescribed)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default server
