const verify = (req) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^bearer /i, '');
  return token === process.env.OPENAI_SERVICE_ACCESS_TOKEN;
};

export default {
  verify,
};
