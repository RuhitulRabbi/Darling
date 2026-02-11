const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "balance.db");
const db = new Database(dbPath);

// === TABLE SETUP ===
db.prepare(`
  CREATE TABLE IF NOT EXISTS balances (
    userID TEXT PRIMARY KEY,
    balance INTEGER
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS daily_claims (
    userID TEXT PRIMARY KEY,
    lastClaim INTEGER
  )
`).run();

// === BALANCE FUNCTIONS ===
function getBalance(userID) {
  const row = db.prepare("SELECT balance FROM balances WHERE userID = ?").get(userID);
  return row ? row.balance : 100; // default 100$
}

function setBalance(userID, balance) {
  db.prepare(`
    INSERT INTO balances (userID, balance)
    VALUES (?, ?)
    ON CONFLICT(userID) DO UPDATE SET balance=excluded.balance
  `).run(userID, balance);
}

// === DAILY FUNCTIONS ===
function canClaim(userID) {
  const row = db.prepare("SELECT lastClaim FROM daily_claims WHERE userID = ?").get(userID);
  if (!row) return true;
  const now = Date.now();
  return now - row.lastClaim >= 24 * 60 * 60 * 1000; // 24 hours
}

function updateClaim(userID) {
  const now = Date.now();
  db.prepare(`
    INSERT INTO daily_claims (userID, lastClaim)
    VALUES (?, ?)
    ON CONFLICT(userID) DO UPDATE SET lastClaim=excluded.lastClaim
  `).run(userID, now);
}

// === FORMAT BALANCE ===
function formatBalance(num) {
  if (num >= 1e12) return (num / 1e12).toFixed(2).replace(/\.00$/, '') + "T$";
  if (num >= 1e9) return (num / 1e9).toFixed(2).replace(/\.00$/, '') + "B$";
  if (num >= 1e6) return (num / 1e6).toFixed(2).replace(/\.00$/, '') + "M$";
  if (num >= 1e3) return (num / 1e3).toFixed(2).replace(/\.00$/, '') + "k$";
  return num + "$";
}

// === MODULE EXPORT ===
module.exports = {
  config: {
    name: "daily",
    version: "2.0",
    author: "MOHAMMAD AKASH",
    shortDescription: "Claim your daily reward",
    role: 0,
    category: "economy",
    guide: { en: "{p}daily - claim your daily reward" }
  },

  onStart: async function({ api, event }) {
    const userID = event.senderID;

    // ===== COOLDOWN CHECK =====
    if (!canClaim(userID)) {
      const row = db.prepare("SELECT lastClaim FROM daily_claims WHERE userID = ?").get(userID);
      const remaining = 24 * 60 * 60 * 1000 - (Date.now() - row.lastClaim);
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      return api.sendMessage(
        `⏳ 𝐘ᴏᴜ 𝐇ᴀᴠᴇ 𝐀ʟʀᴇᴀᴅʏ 𝐂ʟᴀɪᴍᴇᴅ 𝐘ᴏᴜʀ 𝐃ᴀɪʟʏ 𝐑ᴇᴡᴀʀᴅ!\n𝐍ᴇxᴛ 𝐂ʟᴀɪᴍ 𝐈ɴ: ${hours}ʜ ${minutes}ᴍ ${seconds}s`,
        event.threadID
      );
    }

    // ===== GIVE REWARD =====
    const reward = Math.floor(Math.random() * 500) + 500; // 500$ - 1000$
    let balance = getBalance(userID);
    balance += reward;
    setBalance(userID, balance);
    updateClaim(userID);

    return api.sendMessage(
      `🎉 𝐃ᴀɪʟʏ 𝐑ᴇᴡᴀʀᴅ 𝐂ʟᴀɪᴍᴇᴅ!\n💰 𝐘ᴏᴜ 𝐑ᴇᴄᴇɪᴠᴇᴅ: ${reward}$\n🏦 𝐍ᴇᴡ 𝐁ᴀʟᴀɴᴄᴇ: ${formatBalance(balance)}`,
      event.threadID
    );
  }
};
