function verify(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^bearer /i, '');
  return token === process.env.BEARER_AUTH_API_KEY;
}

export default {
  verify,
};
