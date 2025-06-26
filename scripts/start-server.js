const { spawn } = require("child_process")
const path = require("path")

console.log("🚀 Starting Real-Time Chat Server...")

// Start the server
const serverProcess = spawn("node", [path.join(__dirname, "../src/backend/server.js")], {
  stdio: "inherit",
  cwd: process.cwd(),
})

serverProcess.on("error", (error) => {
  console.error("❌ Failed to start server:", error)
  process.exit(1)
})

serverProcess.on("close", (code) => {
  console.log(`🛑 Server process exited with code ${code}`)
  process.exit(code)
})

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down server...")
  serverProcess.kill("SIGINT")
})

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down server...")
  serverProcess.kill("SIGTERM")
})
