const { v4: uuidv4 } = require('uuid');
const { WS_MESSAGE } = require('./Const');

class WebSocketManager {
  constructor() {}

  setup(webSocketServer, server) {
    if (this.webSocketServer) return;

    this.webSocketServer = webSocketServer;
    this.server = server;
    this.activeConnections = new Map();

    // 连接 WebSocket
    this.webSocketServer.on('connection', ws => {
      // 客户端连接后，返回一个独一的id，并记录起来
      const connectionId = uuidv4();
      this.activeConnections.set(connectionId, ws);

      ws.send(
        JSON.stringify({
          type: WS_MESSAGE.CONNECTION_SUCCESS,
          connectionId,
          data: undefined
        })
      );

      ws.on('close', () => {
        this.activeConnections.delete(connectionId);
      });
    });

    // WebSocket 升级处理
    this.server.on('upgrade', (request, socket, head) => {
      this.webSocketServer.handleUpgrade(request, socket, head, ws => {
        this.webSocketServer.emit('connection', ws, request);
      });
    });
  }
}

module.exports = new WebSocketManager();
