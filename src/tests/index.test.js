import 'dotenv/config';
import { jest } from '@jest/globals';
import request from 'supertest';
import server from '../index.js';
import openAI from '../openAI.js';
import db from '../db.js';
import auth from '../auth.js';

const USER_PROMPT = 'Find employees with the first name "Andy"';
const VALID_PAYLOAD = { message: USER_PROMPT };

auth.verify = jest.fn(() => true);
openAI.craftQuery = jest.fn();
openAI.processResult = jest.fn();
db.query = jest.fn(async () => []);

const sendRequest = async (
  body,
  authToken = process.env.OPENAI_SERVICE_AUTH_KEY
) => {
  const response = await request(server)
    .post('/search')
    .set('Authorization', `Bearer ${authToken}`)
    .send(body);
  return response;
};

describe('API tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('POST /', () => {
    const payload = {};
    test('calls auth.verify', async () => {
      await sendRequest(payload);
      expect(auth.verify).toHaveBeenCalled();
    });
    describe('when auth.verify returns false', () => {
      beforeEach(() => {
        auth.verify.mockReturnValueOnce(false);
      });
      test('should not call openAI.craftQuery', async () => {
        await sendRequest(VALID_PAYLOAD);
        expect(openAI.craftQuery).not.toHaveBeenCalled();
      });
      test('should return 401', async () => {
        const response = await sendRequest(VALID_PAYLOAD);
        expect(response.statusCode).toBe(401);
      });
    });
    describe('when auth.verify returns true', () => {
      describe('when payload does not have "message" key', () => {
        test('should not call openAI.craftQuery', async () => {
          await sendRequest(payload);
          expect(openAI.craftQuery).not.toHaveBeenCalled();
        });
        test('should not call db.query', async () => {
          await sendRequest(payload);
          expect(db.query).not.toHaveBeenCalled();
        });
        test('should not call openAI.processResult', async () => {
          await sendRequest(payload);
          expect(openAI.processResult).not.toHaveBeenCalled();
        });
      });
      describe('when payload "message" has no content', () => {
        const payload = { message: '' };
        test('should not call openAI.craftQuery', async () => {
          await sendRequest(payload);
          expect(openAI.craftQuery).not.toHaveBeenCalled();
        });
        test('should not call db.query', async () => {
          await sendRequest(payload);
          expect(db.query).not.toHaveBeenCalled();
        });
        test('should not call openAI.processResult', async () => {
          await sendRequest(payload);
          expect(openAI.processResult).not.toHaveBeenCalled();
        });
      });
      describe('when payload "message" has content', () => {
        test('should call openAI.craftQuery', async () => {
          await sendRequest(VALID_PAYLOAD);
          expect(openAI.craftQuery).toHaveBeenCalled();
        });
        describe('when openAI.craftQuery returns a value', () => {
          const SQL = 'SELECT * from employees';
          beforeEach(() => {
            openAI.craftQuery.mockReturnValue(SQL);
          });
          test('should call db.query', async () => {
            await sendRequest(VALID_PAYLOAD);
            expect(db.query).toHaveBeenCalledWith(SQL);
          });
          describe('when db.query return value is not an array', () => {
            test('should not call openAI.processResult', async () => {
              db.query.mockReturnValue('invalid response');
              await sendRequest(VALID_PAYLOAD);
              expect(openAI.processResult).not.toHaveBeenCalled();
            });
          });
          describe('when db.query.return value is an array', () => {
            test('should call openAI.processResult', async () => {
              const QUERY_RESULTS = [];
              db.query.mockReturnValue(QUERY_RESULTS);
              await sendRequest(VALID_PAYLOAD);
              expect(openAI.processResult).toHaveBeenCalledWith(
                USER_PROMPT,
                SQL,
                QUERY_RESULTS
              );
            });
          });
        });
      });
    });
  });
});
