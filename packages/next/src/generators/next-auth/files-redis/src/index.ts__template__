/**
 * COPIED AND ADJUSTED FROM
 * https://github.com/quanhua92/next-auth-ioredis-adapter-example/blob/main/lib/IORedisAdapter.ts
 *
 * which in turn was based off
 * https://github.com/nextauthjs/next-auth/blob/main/packages/adapter-upstash-redis/src/index.ts
 */

/* eslint-disable unicorn/consistent-function-scoping */
import type { Redis } from 'ioredis';
import type {
  Adapter,
  AdapterAccount,
  AdapterUser,
  AdapterSession as BaseAdapterSession,
  VerificationToken,
} from 'next-auth/adapters';
import { v4 as uuid } from 'uuid';

export interface IORedisAdapterOptions {
  baseKeyPrefix?: string;
  userKeyPrefix?: string;
  accountKeyPrefix?: string;
  accountByUserIdPrefix?: string;
  sessionKeyPrefix?: string;
  sessionByUserIdPrefix?: string;
  userByEmailKeyPrefix?: string;
  verificationKeyPrefix?: string;
}

export const defaultOptions: IORedisAdapterOptions = {
  baseKeyPrefix: '',
  userKeyPrefix: 'user:',
  accountKeyPrefix: 'account:',
  accountByUserIdPrefix: 'account:user:',
  sessionKeyPrefix: 'session:',
  sessionByUserIdPrefix: 'session:user:',
  userByEmailKeyPrefix: 'user:email:',
  verificationKeyPrefix: 'token:',
};

interface AdapterSession extends BaseAdapterSession {
  id?: string;
}

const isoDateRE =
  /(\d{4}-[01]\d-[0-3]\dT[0-2](?:\d:[0-5]){2}\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2](?:\d:[0-5]){2}\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/;

const isDate = (value: any) => {
  return value && isoDateRE.test(value) && !Number.isNaN(Date.parse(value));
};

export function hydrateDates(object: object) {
  return Object.entries(object).reduce((accumulator, [key, value]) => {
    accumulator[key] = isDate(value) ? new Date(value as string) : value;
    return accumulator;
  }, {} as any);
}

export function IORedisAdapter(
  client: Redis,
  options: IORedisAdapterOptions = {}
): Adapter {
  const currentOptions = {
    ...defaultOptions,
    ...options,
  };

  const baseKeyPrefix = currentOptions.baseKeyPrefix || '';
  const userKeyPrefix = baseKeyPrefix + currentOptions.userKeyPrefix;
  const userByEmailKeyPrefix =
    baseKeyPrefix + currentOptions.userByEmailKeyPrefix;
  const accountKeyPrefix = baseKeyPrefix + currentOptions.accountKeyPrefix;
  const accountByUserIdPrefix =
    baseKeyPrefix + currentOptions.accountByUserIdPrefix;
  const sessionKeyPrefix = baseKeyPrefix + currentOptions.sessionKeyPrefix;
  const sessionByUserIdPrefix =
    baseKeyPrefix + currentOptions.sessionByUserIdPrefix;
  const verificationKeyPrefix =
    baseKeyPrefix + currentOptions.verificationKeyPrefix;

  const getUserByEmailKey = (email: string) => userByEmailKeyPrefix + email;
  const getUserKey = (userId: string) => userKeyPrefix + userId;

  const getAccountKey = (accountId: string) => accountKeyPrefix + accountId;
  const getAccountByUserIdKey = (userId: string) =>
    accountByUserIdPrefix + userId;
  const getAccountId = (providerAccountId: string, provider: string) =>
    `${provider}:${providerAccountId}`;

  const getSessionKey = (sessionId: string) => sessionKeyPrefix + sessionId;
  const getSessionByUserIdKey = (userId: string) =>
    sessionByUserIdPrefix + userId;

  const getVerificationKey = (tokenId: string) =>
    verificationKeyPrefix + tokenId;

  const setObjectAsHash = async (key: string, object: any) => {
    const newObject = Object.entries(object).reduce(
      (accumulator, [property, value]) => {
        accumulator[property] =
          value instanceof Date ? value.toISOString() : value;
        return accumulator;
      },
      {} as any
    );
    await client.hset(key, newObject);
  };

  const loadObjectFromHash = async (key: string) => {
    const object = await client.hgetall(key);
    if (!object || Object.keys(object).length === 0) return null;
    const newObject = hydrateDates(object);
    return newObject;
  };

  const setUser = async (
    id: string,
    user: AdapterUser
  ): Promise<AdapterUser> => {
    await setObjectAsHash(getUserKey(id), user);
    if (user.email) await client.set(getUserByEmailKey(user.email), id);
    return user;
  };

  const getUser = async (id: string) => {
    const user = await loadObjectFromHash(getUserKey(id));
    if (!user) return null;
    return { ...user } as AdapterUser;
  };

  const setAccount = async (id: string, account: AdapterAccount) => {
    const accountKey = getAccountKey(id);
    await setObjectAsHash(accountKey, account);
    await client.set(getAccountByUserIdKey(account.userId), accountKey);
    return account;
  };

  const getAccount = async (id: string) => {
    const account = await loadObjectFromHash(getAccountKey(id));
    if (!account) return null;
    return { ...account } as AdapterAccount;
  };

  const deleteAccount = async (id: string) => {
    const key = getAccountKey(id);
    const account = await loadObjectFromHash(key);
    if (!account) return;
    await client.del(key);
    await client.del(getAccountByUserIdKey(account.userId));
  };

  const setSession = async (id: string, session: AdapterSession) => {
    const sessionKey = getSessionKey(id);
    await setObjectAsHash(sessionKey, session);
    await client.set(getSessionByUserIdKey(session.userId), sessionKey);
    return session;
  };

  const getSession = async (id: string) => {
    const session = await loadObjectFromHash(getSessionKey(id));
    if (!session) return null;
    return {
      id: session.id,
      ...session,
    } as AdapterSession;
  };

  const deleteSession = async (sessionToken: string) => {
    const session = await getSession(sessionToken);
    if (!session) return;
    const key = getSessionKey(sessionToken);
    await client.del(key);
    await client.del(getSessionByUserIdKey(session.userId));
  };

  const setVerificationToken = async (id: string, token: VerificationToken) => {
    const tokenKey = getVerificationKey(id);
    await setObjectAsHash(tokenKey, token);
    return token;
  };

  const getVerificationToken = async (id: string) => {
    const tokenKey = getVerificationKey(id);
    const token = await loadObjectFromHash(tokenKey);
    if (!token) return null;
    return { identifier: token.identifier, ...token } as VerificationToken;
  };

  const deleteVerificationToken = async (id: string) => {
    const tokenKey = getVerificationKey(id);
    await client.del(tokenKey);
  };

  return {
    async createUser(user) {
      const id = uuid();
      return setUser(id, { ...user, id });
    },
    getUser,
    async getUserByEmail(email) {
      const userId = await client.get(getUserByEmailKey(email));
      if (!userId) return null;
      return getUser(userId);
    },
    async getUserByAccount({ providerAccountId, provider }) {
      const account = await getAccount(
        getAccountId(providerAccountId, provider)
      );
      if (!account) return null;
      return getUser(account.userId);
    },

    async updateUser(updates) {
      const userId = updates.id as string;
      const user = await getUser(userId);
      return setUser(userId, { ...(user as AdapterUser), ...updates });
    },
    async deleteUser(userId) {
      const user = await getUser(userId);
      if (!user) return;
      const accountKey = await client.get(getAccountByUserIdKey(userId));
      const sessionKey = await client.get(getSessionByUserIdKey(userId));
      await client.del(
        getUserByEmailKey(user.email as string),
        getAccountByUserIdKey(userId),
        getSessionByUserIdKey(userId)
      );
      if (sessionKey) await client.del(sessionKey);
      if (accountKey) await client.del(accountKey);
      await client.del(getUserKey(userId));
    },
    async linkAccount(account) {
      const id = getAccountId(account.providerAccountId, account.provider);
      return setAccount(id, { ...account, id });
    },
    async unlinkAccount({ providerAccountId, provider }) {
      const id = getAccountId(providerAccountId, provider);
      await deleteAccount(id);
    },
    async createSession(session) {
      const id = session.sessionToken;
      return setSession(id, { ...session, id });
    },
    async getSessionAndUser(sessionToken) {
      const id = sessionToken;
      const session = await getSession(id);
      if (!session) return null;
      const user = await getUser(session.userId);
      if (!user) return null;
      return { session, user };
    },
    async updateSession(updates) {
      const id = updates.sessionToken;
      const session = await getSession(id);
      if (!session) return null;
      return setSession(id, { ...session, ...updates });
    },
    deleteSession,
    async createVerificationToken(verificationToken) {
      const id = verificationToken.identifier;
      await setVerificationToken(id, verificationToken);
      return verificationToken;
    },
    async useVerificationToken(verificationToken) {
      const id = verificationToken.identifier;
      const token = await getVerificationToken(id);
      if (!token || verificationToken.token !== token.token) return null;
      await deleteVerificationToken(id);
      return token;
    },
  };
}
