import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import cors from "cors";

const app = express();
app.use(cors());

const BACKEND_URL = "wss://your-render-url.onrender.com";

const server = http.createServer(app);

const wss = new WebSocketServer({ server });

let users = new Map();

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(msg);
    }
  });
}

wss.on("connection", (ws) => {

  ws.on("message", (message) => {
    const data = JSON.parse(message);

    if (data.type === "join") {
      users.set(ws, data.username);
      broadcast({
        type: "system",
        message: `${data.username} joined`,
        online: users.size
      });
    }

    if (data.type === "chat") {
      broadcast({
        type: "chat",
        username: users.get(ws),
        message: data.message,
        time: new Date().toLocaleTimeString(),
        online: users.size
      });
    }
  });

  ws.on("close", () => {
    const name = users.get(ws);
    users.delete(ws);
    broadcast({
      type: "system",
      message: `${name || "User"} left`,
      online: users.size
    });
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});