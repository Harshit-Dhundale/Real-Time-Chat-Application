const AsyncLock = require("async-mutex").Mutex

// In-memory data structures
const chatHistory = new Map() 
const messageQueue = new Map() 
const activeConnections = new Map() 
const messageLock = new AsyncLock() 
module.exports = {
  chatHistory,
  messageQueue,
  activeConnections,
  messageLock,
}
