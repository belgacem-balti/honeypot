const { randomUUID } = require('crypto');
const { cacheGet, cacheSet } = require('../config/redis');

const TTL = 60 * 60 * 24; // 24 h

function keyFor(userId) {
  return `notifications:${userId}`;
}

async function addNotification(userId, { title, body, type = 'info' }) {
  const list = (await cacheGet(keyFor(userId))) || [];
  const item = {
    id: randomUUID(),
    title,
    body,
    type,
    read: false,
    createdAt: new Date().toISOString()
  };
  list.unshift(item);
  await cacheSet(keyFor(userId), list.slice(0, 50), TTL);
  return item;
}

async function listNotifications(userId) {
  return (await cacheGet(keyFor(userId))) || [];
}

async function unreadCount(userId) {
  const list = (await cacheGet(keyFor(userId))) || [];
  return list.filter((n) => !n.read).length;
}

async function markRead(userId, id) {
  const list = (await cacheGet(keyFor(userId))) || [];
  const next = list.map((item) => (item.id === id ? { ...item, read: true } : item));
  await cacheSet(keyFor(userId), next, TTL);
  return next.find((item) => item.id === id);
}

async function markAllRead(userId) {
  const list = (await cacheGet(keyFor(userId))) || [];
  const next = list.map((item) => ({ ...item, read: true }));
  await cacheSet(keyFor(userId), next, TTL);
  return next;
}

module.exports = { addNotification, listNotifications, unreadCount, markRead, markAllRead };
