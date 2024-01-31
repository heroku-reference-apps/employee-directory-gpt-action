# Employee Directory Lookup - GPT Action

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

This is a Node.js Express API server meant to function as an OpenAI GPT Action. It simulates an employee directory querying service. It is meant to be deployed to Heroku.

## Create Heroku App

First create a Heroku app to deploy this application by running:

```sh
heroku create <app-name>
```

## Setup database

Along with your basic Heroku app, you will need to use a PostgreSQL add-on.
You can do it manually by running:

```sh
heroku addons:create heroku-postgresql:mini
```

Once your database is set up, you should run the SQL statements found in the following two files (in this order):

1. `data/create_schema.sql` (which creates the `employees` table and enum types)
2. `data/create_records.sql` (which inserts 500 sample records into the `employees` table)

You can do it by running:

```sh
heroku pg:psql < data/create_schema.sql
heroku pg:psql < data/create_records.sql
```

Once you have the database up and running, Heroku will automatically add a config var called `DATABASE_URL`. This should contain all of the information you need for connecting to the database (in `src/db.js`).

## Use of the OpenAI API

This service also makes its own calls to the OpenAI Chat Completions APIs. To use the API, you will need to obtain an OpenAI API Key. Once you have that, you will need to add the following Heroku app config var:

- `OPENAI_API_KEY`

By default, this service will use the `gpt-3.5-turbo-1106` [OpenAI model](https://platform.openai.com/docs/models/overview). In our testing, we found that the GPT-4 model performs more accurately at times, but it is too slow, often causing requests to take longer than the 30-second timeout for Heroku apps. Using a GPT-3.5 model was necessary to accomplish a fast enough response. If you want to change the model used (for speed or performance reasons), you can specify the model by setting a Heroku app config var called `CHATGPT_MODEL`.

### 1. Generate an API Key

You can use any freely available password generator.

### 2. Update your Heroku app config vars

Add a new key called `BEARER_AUTH_API_KEY` with this key value.

### 3. Update your Heroku app config vars with OpenAI API Key

Add a new key called `OPENAI_API_KEY` with this generated token value.
