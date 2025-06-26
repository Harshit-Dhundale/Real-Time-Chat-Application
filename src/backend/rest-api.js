const express = require("express")
const { chatHistory } = require("./storage")

const router = express.Router()

router.get("/messages", (req, res) => {
  try {
    const { user1, user2 } = req.query

    if (!user1 || !user2) {
      return res.status(400).json({ error: "Both user1 and user2 parameters are required" })
    }

    const chatKey = [user1, user2].sort().join(":")
    const messages = chatHistory.get(chatKey) || []

    res.json({
      chatKey,
      messages: messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
    })
  } catch (error) {
    console.log(`⛔ Error: REST API error - ${error.message}`)
    res.status(500).json({ error: "Internal server error" })
  }
})

router.get("/status", (req, res) => {
  const { activeConnections, messageQueue, chatHistory } = require("./storage")

  res.json({
    activeUsers: Array.from(activeConnections.keys()),
    queuedMessages: Object.fromEntries(messageQueue),
    totalChats: chatHistory.size,
  })
})

module.exports = router
