export const BAD_REQUEST = {
  error: 'Bad Request',
  message: 'No query provided in "message" key of payload.',
  statusCode: 400,
};

export const UNAUTHORIZED = {
  error: 'Unauthorized',
  message: 'Using bearer auth. API key was either not provided or incorrect.',
  statusCode: 401,
};

export const RESULT_NOT_FOUND = {
  error: 'Not Found',
  message: 'Sorry. I was unable to track down what you were looking for',
  statusCode: 404,
};

export const INTERNAL_SERVER_ERROR = {
  error: 'Internal Server Error',
  message: 'An internal server error occurred',
  statusCode: 500,
};
