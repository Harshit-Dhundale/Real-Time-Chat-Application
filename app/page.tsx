
"use client"

import { useState, useEffect, useRef } from "react"
import { Send, MessageSquare, History, User, Users, Activity } from "lucide-react"

interface Message {
  id: string
  from: string
  to: string
  content: string
  timestamp: string
}

interface LogEntry {
  timestamp: string
  type: "connection" | "message" | "error" | "ack"
  content: string
}

export default function ChatApp() {
  const [userId, setUserId] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [sendTo, setSendTo] = useState("")
  const [messageContent, setMessageContent] = useState("")
  const [historyUser1, setHistoryUser1] = useState("")
  const [historyUser2, setHistoryUser2] = useState("")
  const [chatHistory, setChatHistory] = useState<Message[]>([])

  const wsRef = useRef<WebSocket | null>(null)

  const addLog = (type: LogEntry["type"], content: string) => {
    setLogs((prev) => [
      ...prev,
      {
        timestamp: new Date().toLocaleTimeString(),
        type,
        content,
      },
    ])
  }

  const connect = () => {
    if (!userId.trim()) {
      addLog("error", "User ID is required")
      return
    }

    try {
      const websocket = new WebSocket(`ws://localhost:8080?userId=${encodeURIComponent(userId)}`)

      websocket.onopen = () => {
        setIsConnected(true)
        setWs(websocket)
        wsRef.current = websocket
        addLog("connection", `📡 Connected as ${userId}`)
      }

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === "ack") {
            addLog("ack", `✅ Message ${data.ack} acknowledged`)
          } else if (data.from && data.to && data.content) {
            setMessages((prev) => [...prev, data])
            addLog("message", `✉️ Received from ${data.from}: ${data.content}`)
          }
        } catch (error) {
          addLog("error", `Failed to parse message: ${error}`)
        }
      }

      websocket.onclose = () => {
        setIsConnected(false)
        setWs(null)
        wsRef.current = null
        addLog("connection", `🚫 Disconnected`)
      }

      websocket.onerror = (error) => {
        addLog("error", `⛔ WebSocket error: ${error}`)
      }
    } catch (error) {
      addLog("error", `Failed to connect: ${error}`)
    }
  }

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close()
    }
  }

  const sendMessage = () => {
    if (!wsRef.current || !sendTo.trim() || !messageContent.trim()) {
      addLog("error", "Connection, recipient, and message content are required")
      return
    }

    const message = {
      type: "chat",
      to: sendTo,
      content: messageContent,
    }

    try {
      wsRef.current.send(JSON.stringify(message))
      addLog("message", `📤 Sent to ${sendTo}: ${messageContent}`)
      setMessageContent("")
    } catch (error) {
      addLog("error", `Failed to send message: ${error}`)
    }
  }

  const fetchHistory = async () => {
    if (!historyUser1.trim() || !historyUser2.trim()) {
      addLog("error", "Both users are required for history fetch")
      return
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/messages?user1=${encodeURIComponent(historyUser1)}&user2=${encodeURIComponent(historyUser2)}`,
      )
      const data = await response.json()

      if (response.ok) {
        setChatHistory(data.messages || [])
        addLog("message", `📚 Fetched ${data.messages?.length || 0} messages for ${data.chatKey}`)
      } else {
        addLog("error", `Failed to fetch history: ${data.error}`)
      }
    } catch (error) {
      addLog("error", `Failed to fetch history: ${error}`)
    }
  }

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  return (
    <div className="min-h-screen">
      <div className="container p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1>Real-Time Chat</h1>
          <p>WebSocket-based messaging with offline buffering</p>
        </div>

        {/* Main Chat Interface */}
        <div className="grid xl:grid-cols-3 gap-6 mb-6">
          {/* Connection & Send Message */}
          <div className="xl:col-span-2 space-y-6">
            {/* Connection Panel */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <div className="card-title-content">
                    <div className="card-icon">
                      <User />
                    </div>
                    <div>
                      <h2 className="section-title">Connection</h2>
                      <p className="section-subtitle">Connect to start chatting</p>
                    </div>
                  </div>
                  <div className={`status-badge ${isConnected ? "status-connected" : "status-disconnected"}`}>
                    <div className={`status-dot ${isConnected ? "connected" : "disconnected"}`}></div>
                    {isConnected ? "Connected" : "Disconnected"}
                  </div>
                </div>
              </div>
              <div className="card-content">
                <div className="input-group">
                  <input
                    className="input flex-1"
                    placeholder="Enter your username"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    disabled={isConnected}
                  />
                  <button
                    className={`button ${isConnected ? "button-destructive" : "button-primary"}`}
                    onClick={isConnected ? disconnect : connect}
                  >
                    {isConnected ? "Disconnect" : "Connect"}
                  </button>
                </div>
              </div>
            </div>

            {/* Send Message */}
            <div className="card">
              <div className="card-header">
                <div className="card-title-content">
                  <div className="card-icon">
                    <MessageSquare />
                  </div>
                  <div>
                    <h2 className="section-title">Send Message</h2>
                    <p className="section-subtitle">Send a message to another user</p>
                  </div>
                </div>
              </div>
              <div className="card-content space-y-4">
                <input
                  className="input"
                  placeholder="Recipient username"
                  value={sendTo}
                  onChange={(e) => setSendTo(e.target.value)}
                  disabled={!isConnected}
                />
                <div className="input-group">
                  <input
                    className="input flex-1"
                    placeholder="Type your message..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    disabled={!isConnected}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  />
                  <button className="button button-primary button-icon" onClick={sendMessage} disabled={!isConnected}>
                    <Send />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Received Messages */}
          <div className="card">
            <div className="card-header">
              <div className="card-title-content">
                <div className="card-icon">
                  <Users />
                </div>
                <div>
                  <h2 className="section-title">Messages</h2>
                  <p className="section-subtitle">Incoming messages</p>
                </div>
              </div>
            </div>
            <div className="card-content">
              <div className="scroll-area h-80">
                {messages.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <MessageSquare />
                    </div>
                    <p className="empty-text">No messages yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div key={msg.id} className="space-y-2">
                        <div className="message-header">
                          <span className="message-sender">{msg.from}</span>
                          <span className="message-time">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="message-bubble">
                          <p>{msg.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Chat History */}
          <div className="card">
            <div className="card-header">
              <div className="card-title-content">
                <div className="card-icon">
                  <History />
                </div>
                <div>
                  <h2 className="section-title">Chat History</h2>
                  <p className="section-subtitle">View conversation history</p>
                </div>
              </div>
            </div>
            <div className="card-content space-y-4">
              <div className="input-group">
                <input
                  className="input"
                  placeholder="User 1"
                  value={historyUser1}
                  onChange={(e) => setHistoryUser1(e.target.value)}
                />
                <input
                  className="input"
                  placeholder="User 2"
                  value={historyUser2}
                  onChange={(e) => setHistoryUser2(e.target.value)}
                />
                <button className="button button-primary" onClick={fetchHistory}>
                  Fetch
                </button>
              </div>
              <div className="scroll-area h-48">
                {chatHistory.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <History />
                    </div>
                    <p className="empty-text">No history found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chatHistory.map((msg) => (
                      <div key={msg.id} className="history-message">
                        <div className="history-header">
                          <span className="history-users">
                            {msg.from} → {msg.to}
                          </span>
                          <span className="message-time">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="history-content">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Event Log */}
          <div className="card">
            <div className="card-header">
              <div className="card-title-content">
                <div className="card-icon">
                  <Activity />
                </div>
                <div>
                  <h2 className="section-title">Activity Log</h2>
                  <p className="section-subtitle">System events and messages</p>
                </div>
              </div>
            </div>
            <div className="card-content">
              <div className="scroll-area h-48">
                {logs.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <Activity />
                    </div>
                    <p className="empty-text">No activity yet</p>
                  </div>
                ) : (
                  <div>
                    {logs.map((log, index) => (
                      <div key={index} className="log-entry">
                        <span className="log-time">{log.timestamp}</span>
                        <span className={`log-badge ${log.type}`}>{log.type}</span>
                        <span className="log-content">{log.content}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
