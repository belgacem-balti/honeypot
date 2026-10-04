const Redis = require('ioredis');

let client;
let memory = new Map();
let connected = false;
const stats = { hits: 0, misses: 0, mode: 'memory' };

function getClient() {
  if (client !== undefined) return client;
  const url = process.env.REDIS_URL;
  if (!url) {
    client = null;
    stats.mode = 'memory';
    return client;
  }
  try {
    client = new Redis(url, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: true
    });
    client.on('error', () => {
      connected = false;
      stats.mode = 'memory';
    });
    client.on('ready', () => {
      connected = true;
      stats.mode = 'redis';
    });
    client.connect().catch(() => {
      connected = false;
      stats.mode = 'memory';
    });
  } catch (_error) {
    client = null;
    stats.mode = 'memory';
  }
  return client;
}

async function cacheGet(key) {
  const redis = getClient();
  try {
    if (redis && connected) {
      const value = await redis.get(key);
      if (value) {
        stats.hits += 1;
        return JSON.parse(value);
      }
      stats.misses += 1;
      return null;
    }
  } catch (_error) {
    stats.mode = 'memory';
  }
  if (memory.has(key)) {
    const entry = memory.get(key);
    if (entry.expiresAt > Date.now()) {
      stats.hits += 1;
      return entry.value;
    }
    memory.delete(key);
  }
  stats.misses += 1;
  return null;
}

async function cacheSet(key, value, ttlSeconds = Number(process.env.CACHE_TTL_SECONDS || 60)) {
  const redis = getClient();
  try {
    if (redis && connected) {
      await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      return;
    }
  } catch (_error) {
    stats.mode = 'memory';
  }
  memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

async function cacheDel(key) {
  const redis = getClient();
  try {
    if (redis && connected) {
      await redis.del(key);
    }
  } catch (_error) {
    stats.mode = 'memory';
  }
  memory.delete(key);
}

async function cacheDelPattern(prefix) {
  const redis = getClient();
  try {
    if (redis && connected) {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length) await redis.del(keys);
      } while (cursor !== '0');
    }
  } catch (_error) {
    stats.mode = 'memory';
  }
  for (const key of memory.keys()) {
    if (key.startsWith(prefix)) memory.delete(key);
  }
}

async function pingCache() {
  const redis = getClient();
  try {
    if (redis) {
      await redis.ping();
      connected = true;
      stats.mode = 'redis';
      return { healthy: true, mode: 'redis' };
    }
  } catch (_error) {
    connected = false;
  }
  return { healthy: true, mode: 'memory' };
}

function getCacheStats() {
  return { ...stats, connected, size: memory.size };
}

async function disconnectCache() {
  if (client) {
    try {
      await client.quit();
    } catch (_error) {
      // ignore
    }
  }
}

module.exports = {
  getClient,
  cacheGet,
  cacheSet,
  cacheDel,
  cacheDelPattern,
  pingCache,
  getCacheStats,
  disconnectCache
};
