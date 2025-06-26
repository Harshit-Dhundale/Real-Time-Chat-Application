const express = require("express")
const http = require("http")
const websocket = require("./websocket")
const restApi = require("./rest-api")

const app = express()

// Middleware
app.use(express.json())

//CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  next()
})

// REST API routes
app.use("/api", restApi)

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() })
})

// Create HTTP server
const server = http.createServer(app)

// Initialize WebSocket server
websocket(server)

const PORT = process.env.PORT || 8080

server.listen(PORT, () => {
  console.log("✅ Server running on http://localhost:" + PORT)
  console.log("📡 WebSocket server ready for connections")
  console.log("🎯 API available at http://localhost:" + PORT + "/api")
})

module.exports = server
