const WebSocket = require("ws")
const { chatHistory, messageQueue, activeConnections, messageLock } = require("./storage")

// Process incoming message with lock
async function processMessage(senderId, { to, content }) {
  await messageLock.runExclusive(async () => {
    try {
      const msgId = Date.now().toString()
      const timestamp = new Date().toISOString()
      const message = { id: msgId, from: senderId, to, content, timestamp }

      // Save to history
      const chatKey = [senderId, to].sort().join(":")
      const existingHistory = chatHistory.get(chatKey) || []
      chatHistory.set(chatKey, [...existingHistory, message])

      // Deliver or buffer
      if (activeConnections.has(to)) {
        const recipientWs = activeConnections.get(to)
        if (recipientWs.readyState === WebSocket.OPEN) {
          recipientWs.send(JSON.stringify(message))
          console.log(`✉️ Real-time delivery to ${to}`)
        }
      } else {
        const existingQueue = messageQueue.get(to) || []
        messageQueue.set(to, [...existingQueue, message])
        console.log(`📦 Buffered message for ${to}`)
      }

      // Send ACK to sender
      const senderWs = activeConnections.get(senderId)
      if (senderWs && senderWs.readyState === WebSocket.OPEN) {
        senderWs.send(JSON.stringify({ ack: msgId, type: "ack" }))
      }
    } catch (error) {
      console.log(`⛔ Error: Message processing failed - ${error.message}`)
    }
  })
}

// Deliver buffered messages
function deliverBufferedMessages(userId) {
  if (messageQueue.has(userId)) {
    const bufferedMessages = messageQueue.get(userId)
    const userWs = activeConnections.get(userId)

    if (userWs && userWs.readyState === WebSocket.OPEN) {
      bufferedMessages.forEach((msg) => {
        userWs.send(JSON.stringify(msg))
      })
      console.log(`🚚 Delivered ${bufferedMessages.length} buffered messages to ${userId}`)
      messageQueue.delete(userId)
    }
  }
}

module.exports = (server) => {
  const wss = new WebSocket.Server({ server })

  wss.on("connection", (ws, req) => {
    // Extract user ID from query params: ws://localhost?userId=A
    const url = new URL(req.url, `http://${req.headers.host}`)
    const userId = url.searchParams.get("userId")

    if (!userId) {
      ws.close(1008, "User ID required")
      return
    }

    // Add to active connections
    activeConnections.set(userId, ws)
    console.log(`📡 ${userId} connected`)

    // Deliver queued messages
    deliverBufferedMessages(userId)

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data)
        if (message.type === "chat" && message.to && message.content) {
          processMessage(userId, message)
        }
      } catch (error) {
        console.log(`⛔ Error: Invalid message format - ${error.message}`)
      }
    })

    ws.on("close", () => {
      activeConnections.delete(userId)
      console.log(`🚫 ${userId} disconnected`)
    })

    ws.on("error", (error) => {
      console.log(`⛔ Error: WebSocket error for ${userId} - ${error.message}`)
      activeConnections.delete(userId)
    })
  })

  return wss
}
