
const { spawn } = require("child_process")
const path = require("path")

console.log("🚀 Starting Real-Time Chat Development Environment...")
console.log("📋 This will start:")
console.log("   - Backend server on http://localhost:8080")
console.log("   - Next.js frontend on http://localhost:3000")
console.log("")

// Start the backend server
console.log("🔧 Starting backend server...")
const backendProcess = spawn("node", [path.join(__dirname, "../src/backend/server.js")], {
  stdio: "inherit",
  cwd: process.cwd(),
})

backendProcess.on("error", (error) => {
  console.error("❌ Failed to start backend server:", error)
  process.exit(1)
})

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down servers...")
  backendProcess.kill("SIGINT")
  process.exit(0)
})

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down servers...")
  backendProcess.kill("SIGTERM")
  process.exit(0)
})

console.log("")
console.log("✅ Backend server started!")
console.log("🌐 Now run 'npm run dev' in another terminal to start the Next.js frontend")
console.log("📱 Frontend will be available at: http://localhost:3000")
console.log("🔌 Backend API available at: http://localhost:8080/api")
console.log("🔗 WebSocket server ready at: ws://localhost:8080")
