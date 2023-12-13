import 'openai/shims/node'
import logger from './logger.js'
import OpenAI from 'openai'

const openai = new OpenAI({ maxRetries: 3 })
const TEMPERATURE = process.env.TEMPERATURE || 0.3
const CHATGPT_MODEL = process.env.CHATGPT_MODEL || 'gpt-3.5-turbo-1106'
const PROMPT = `
  I have a psql db with an "employees" table, created with the following statements:

  create type department_enum as enum('Accounting','Sales','Engineering','Marketing','Product','Customer Service','HR');
  create type title_enum as enum('Assistant', 'Manager', 'Junior Executive', 'President', 'Vice-President', 'Associate', 'Intern', 'Contractor');
  create table employees(id char(36) not null unique primary key, first_name varchar(64) not null, last_name varchar(64) not null, email text not null, department department_enum not null, title title_enum not null, hire_date date not null);
`.trim()

const SYSTEM_MESSAGE = { role: 'system', content: PROMPT }

const craftQuery = async (userPrompt) => {
  const settings = {
    messages: [SYSTEM_MESSAGE],
    model: CHATGPT_MODEL,
    temperature: TEMPERATURE,
    response_format: {
      type: 'json_object'
    }
  }

  settings.messages.push({
    role: 'system',
    content: 'Output JSON with the query under the "sql" key.'
  })

  settings.messages.push({
    role: 'user',
    content: userPrompt
  })
  settings.messages.push({
    role: 'user',
    content: 'Provide a single SQL query to obtain the desired result.'
  })

  logger.info('craftQuery sending request to openAI')

  const response = await openai.chat.completions.create(settings)
  const content = JSON.parse(response.choices[0].message.content)
  return content.sql
}

const processResult = async (userPrompt, sql, rows) => {
  const settings = {
    messages: [SYSTEM_MESSAGE],
    model: CHATGPT_MODEL,
    temperature: TEMPERATURE
  }

  const userMessage = `
    This is how I described I was looking for: ${userPrompt}

    This is the query sent to find the results: ${sql}

    Here is the resulting data that you found:
    ${JSON.stringify(rows)}

    Assume I am not even aware that a database query was run. Do not include the SQL query in your response to me. If the original request does not explicitly specify a sort order, then sort the results in the most natural way. Return the resulting data to me in a human-readable way, not as an object or an array. Keep your response direct. Tell me what you found and how it is sorted.'
  `
  settings.messages.push({
    role: 'user',
    content: userMessage
  })

  logger.info('processResult sending request to openAI')

  const response = await openai.chat.completions.create(settings)
  return response.choices[0].message.content
}

export default {
  craftQuery,
  processResult
}
