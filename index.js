import 'dotenv/config';
import server from './src/index.js';

const PORT = process.env.PORT || 3000;

function checkEnvVariable(variableName) {
  if (process.env[variableName] == null) {
    console.error(`${variableName} is not set`);
    process.exit(1);
  }
}

checkEnvVariable('BEARER_AUTH_API_KEY');
checkEnvVariable('OPENAI_API_KEY');
checkEnvVariable('DATABASE_URL');

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
