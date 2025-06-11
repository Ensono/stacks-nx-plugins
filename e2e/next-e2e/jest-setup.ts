import Redis from 'ioredis-mock';

jest.mock('ioredis', () => Redis, { virtual: true });
