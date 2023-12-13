# OpenAI ChatGPT Plugin: Employee Directory Lookup

This is a Node.js Express API server meant to function as an OpenAI ChatGPT Plugin. It simulates an employee directory querying service. It is meant to be deployed on Heroku.

## Setup database

Along with your basic Heroku app, you will need to use a PostgreSQL add-on. Once your database is set up, you should run the SQL statements found in the following two files (in this order):

1. `/data/create_schema.sql` (which creates the `employees` table and enum types)
2. `/data/create_records.sql` (which inserts 500 records into the `employees` table)

Once you have the database up and running, Heroku will automatically add a config var called `DATABASE_URL`. This should contain all of the information you need for connecting to the database (in `/src/psql.js`).

## Use of the OpenAI API

This service also makes its own calls to the OpenAI Chat Completions APIs. To use the API, you will need to obtain an OpenAI API Key. Once you have that, you will need to add the following Heroku app config var:

* `OPENAI_API_KEY`

By default, this service will use the `gpt-3.5-turbo-1106` [OpenAI model](https://platform.openai.com/docs/models/overview). In our testing, we found that the GPT-4 model performs more accurately at times, but it is too slow, often causing requests to take longer than the 30-second timeout for Heroku apps. Using a GPT-3.5 model was necessary to accomplish a fast enough response. If you want to change the model used (for speed or performance reasons), you can specify the model by setting a Heroku app config var called `CHATGPT_MODEL`.

## Service level authentication for accessing the plugin.

This plugin is configured to use [service level auth with ChatGPT](https://platform.openai.com/docs/plugins/authentication). Follow the instructions there for setting up your developer plugin. You will prompted for a service access token. This is a string that **you generate** and specify. Follow these steps:

### 1. Generate a token

You can use any freely available password generator.

### 2. Update your Heroku app config vars

Add a new key called `OPENAI_SERVICE_ACCESS_TOKEN` with this token value.

### 3. Exchange the service access token for a verification token from OpenAI

When setting up your plugin with OpenAI, you will provide the service access token that you generated. OpenAI will encrypt and store that service access token. Then, OpenAI will give you a verification token.

### 3. Update `ai-plugin.json`

Update the plugin manifest file at `/.well-known/ai-plugin.json` to set `auth => verification_tokens => openai` with the verification token value. **NOTE:** Do NOT put your service access token here. That is meant to be private. Instead, use the verification token. OpenAI will use the verification token (which is public, because `ai-plugin.json` is publicly accessible), retrieve the private service access token, and supply it when making requests to this API.

(Tip: Don't commit this file yet. You'll need to do more editing in the next section.)

## Update ai-plugin.json with Heroku URLs after app creation

The ChatGPT plugin manifest (`/.well-known/ai-plugin.json`) includes specific URLs for additional resources. Since it is simplest to keep those resources in this repository, this means that you need to update this file _after_ you have created your Heroku app, inserting your Heroku app URL.

After your app has been created, edit `ai-plugin.json` to use the Heroku app URL in the following places:

1. `api => url`
2. `logo_url`
3. `legal_info_url`

Save the file and commit to your repo. Then, redeploy the updated application at Heroku.
