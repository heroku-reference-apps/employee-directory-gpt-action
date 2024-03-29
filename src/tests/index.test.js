import 'dotenv/config';
import { jest } from '@jest/globals';

import request from 'supertest';
import AI from '../ai.js';
import db from '../db.js';
import auth from '../auth.js';
import server from '../index.js';

const USER_PROMPT = 'Find employees with the first name "Andy"';
const VALID_PAYLOAD = { message: USER_PROMPT };

auth.verify = jest.fn(() => true);
AI.craftQuery = jest.fn();
AI.processResult = jest.fn();
db.query = jest.fn(async () => []);

const sendRequest = async (
  body,
  authToken = process.env.BEARER_AUTH_API_KEY
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
  describe('POST /search', () => {
    const payload = {};
    test('calls auth.verify', async () => {
      await sendRequest(payload);
      expect(auth.verify).toHaveBeenCalled();
    });
    describe('when auth.verify returns false', () => {
      beforeEach(() => {
        auth.verify.mockReturnValueOnce(false);
      });
      test('should not call AI.craftQuery', async () => {
        await sendRequest(VALID_PAYLOAD);
        expect(AI.craftQuery).not.toHaveBeenCalled();
      });
      test('should return 401', async () => {
        const response = await sendRequest(VALID_PAYLOAD);
        expect(response.statusCode).toBe(401);
      });
    });
    describe('when auth.verify returns true', () => {
      describe('when payload does not have "message" key', () => {
        test('should not call AI.craftQuery', async () => {
          await sendRequest(payload);
          expect(AI.craftQuery).not.toHaveBeenCalled();
        });
        test('should not call db.query', async () => {
          await sendRequest(payload);
          expect(db.query).not.toHaveBeenCalled();
        });
        test('should not call AI.processResult', async () => {
          await sendRequest(payload);
          expect(AI.processResult).not.toHaveBeenCalled();
        });
      });
      describe('when payload "message" has no content', () => {
        const payload = { message: '' };
        test('should not call AI.craftQuery', async () => {
          await sendRequest(payload);
          expect(AI.craftQuery).not.toHaveBeenCalled();
        });
        test('should not call db.query', async () => {
          await sendRequest(payload);
          expect(db.query).not.toHaveBeenCalled();
        });
        test('should not call AI.processResult', async () => {
          await sendRequest(payload);
          expect(AI.processResult).not.toHaveBeenCalled();
        });
      });
      describe('when payload "message" has content', () => {
        test('should call AI.craftQuery', async () => {
          await sendRequest(VALID_PAYLOAD);
          expect(AI.craftQuery).toHaveBeenCalled();
        });
        describe('when AI.craftQuery returns a value', () => {
          const SQL = 'SELECT * from employees';
          beforeEach(() => {
            AI.craftQuery.mockReturnValue(SQL);
          });
          test('should call db.query', async () => {
            await sendRequest(VALID_PAYLOAD);
            expect(db.query).toHaveBeenCalledWith(SQL);
          });
          describe('when db.query return value is not an array', () => {
            test('should not call AI.processResult', async () => {
              db.query.mockReturnValue('invalid response');
              await sendRequest(VALID_PAYLOAD);
              expect(AI.processResult).not.toHaveBeenCalled();
            });
          });
          describe('when db.query.return value is an array', () => {
            test('should call AI.processResult', async () => {
              const QUERY_RESULTS = [];
              db.query.mockReturnValue(QUERY_RESULTS);
              await sendRequest(VALID_PAYLOAD);
              expect(AI.processResult).toHaveBeenCalledWith(
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
