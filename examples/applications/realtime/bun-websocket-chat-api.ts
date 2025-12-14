#!/usr/bin/env bun

/**
 * @example-metadata
 * @category applications/realtime
 * @difficulty intermediate
 * @prerequisites bun-serve-advanced.ts, bun-websocket-server-official.ts
 * @related-examples
 *   - bun-serve-advanced.ts (WebSocket upgrade handling)
 *   - bun-websocket-server-official.ts (basic WebSocket server)
 *   - bun-http-session.ts (authentication integration)
 *   - bun-rate-limiting.ts (connection rate limiting)
 * @guides bun-websocket-guide.md, bun-realtime-communication.md
 * @tests bun-websocket-chat-testing.test.ts
 * @benchmarks bun-websocket-chat-performance.bench.ts
 * @tags websocket, realtime, chat, messaging, rooms, authentication
 * @description Real-time WebSocket chat API with rooms, authentication, message history, and connection management
 */

import { serve } from "bun";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ChatUser {
  id: string;
  username: string;
  avatar?: string;
  connectedAt: number;
  lastActivity: number;
  room: string;
}

interface ChatMessage {
  id: string;
  type: 'message' | 'join' | 'leave' | 'system' | 'private';
  userId: string;
  username: string;
  content: string;
  room: string;
  timestamp: number;
  replyTo?: string;
  mentions?: string[];
  reactions?: { [emoji: string]: string[] }; // emoji -> userIds
}

interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  password?: string;
  maxUsers?: number;
  createdAt: number;
  users: Set<string>; // user IDs
  messages: ChatMessage[]; // recent messages
  moderators: Set<string>; // user IDs
}

interface WebSocketData {
  userId?: string;
  room?: string;
  authenticated: boolean;
}

// ============================================================================
// CHAT ROOM MANAGER
// ============================================================================

class ChatRoomManager {
  private rooms = new Map<string, ChatRoom>();
  private users = new Map<string, ChatUser>();
  private connections = new Map<string, WebSocket>();

  constructor() {
    // Create default rooms
    this.createRoom({
      id: 'general',
      name: 'General',
      description: 'General discussion',
      isPrivate: false,
      maxUsers: 100,
    });

    this.createRoom({
      id: 'random',
      name: 'Random',
      description: 'Random conversations',
      isPrivate: false,
      maxUsers: 50,
    });

    this.createRoom({
      id: 'support',
      name: 'Support',
      description: 'Get help and support',
      isPrivate: false,
      maxUsers: 25,
    });
  }

  createRoom(roomData: {
    id: string;
    name: string;
    description?: string;
    isPrivate?: boolean;
    password?: string;
    maxUsers?: number;
  }): ChatRoom {
    const room: ChatRoom = {
      id: roomData.id,
      name: roomData.name,
      description: roomData.description,
      isPrivate: roomData.isPrivate || false,
      password: roomData.password,
      maxUsers: roomData.maxUsers || 100,
      createdAt: Date.now(),
      users: new Set(),
      messages: [],
      moderators: new Set(),
    };

    this.rooms.set(room.id, room);
    console.log(`🏠 Created chat room: ${room.name} (${room.id})`);
    return room;
  }

  getRoom(roomId: string): ChatRoom | null {
    return this.rooms.get(roomId) || null;
  }

  getAllRooms(): ChatRoom[] {
    return Array.from(this.rooms.values());
  }

  joinRoom(userId: string, roomId: string, password?: string): { success: boolean; error?: string; room?: ChatRoom } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.isPrivate && room.password && room.password !== password) {
      return { success: false, error: 'Invalid password' };
    }

    if (room.maxUsers && room.users.size >= room.maxUsers) {
      return { success: false, error: 'Room is full' };
    }

    // Leave current room if any
    this.leaveCurrentRoom(userId);

    // Join new room
    room.users.add(userId);
    const user = this.users.get(userId);
    if (user) {
      user.room = roomId;
      user.lastActivity = Date.now();
    }

    console.log(`👥 User ${userId} joined room ${roomId}`);
    return { success: true, room };
  }

  leaveCurrentRoom(userId: string): void {
    const user = this.users.get(userId);
    if (user && user.room) {
      const room = this.rooms.get(user.room);
      if (room) {
        room.users.delete(userId);
        console.log(`👋 User ${userId} left room ${user.room}`);
      }
      user.room = '';
    }
  }

  addUser(userData: {
    id: string;
    username: string;
    avatar?: string;
    room?: string;
  }): ChatUser {
    const user: ChatUser = {
      id: userData.id,
      username: userData.username,
      avatar: userData.avatar,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      room: userData.room || 'general',
    };

    this.users.set(user.id, user);

    // Join initial room
    if (user.room) {
      this.joinRoom(user.id, user.room);
    }

    console.log(`👤 User connected: ${user.username} (${user.id})`);
    return user;
  }

  removeUser(userId: string): void {
    this.leaveCurrentRoom(userId);
    this.users.delete(userId);
    this.connections.delete(userId);
    console.log(`🚪 User disconnected: ${userId}`);
  }

  updateUserActivity(userId: string): void {
    const user = this.users.get(userId);
    if (user) {
      user.lastActivity = Date.now();
    }
  }

  addMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const fullMessage: ChatMessage = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...message,
    };

    const room = this.rooms.get(message.room);
    if (room) {
      // Keep only last 100 messages per room
      room.messages.push(fullMessage);
      if (room.messages.length > 100) {
        room.messages = room.messages.slice(-100);
      }
    }

    console.log(`💬 Message in ${message.room}: ${message.username}: ${message.content.substring(0, 50)}...`);
    return fullMessage;
  }

  getRoomMessages(roomId: string, limit: number = 50): ChatMessage[] {
    const room = this.rooms.get(roomId);
    return room ? room.messages.slice(-limit) : [];
  }

  getOnlineUsers(roomId?: string): ChatUser[] {
    const users = Array.from(this.users.values());

    if (roomId) {
      return users.filter(user => user.room === roomId);
    }

    return users;
  }

  registerConnection(userId: string, ws: WebSocket): void {
    this.connections.set(userId, ws as any);
  }

  getConnection(userId: string): WebSocket | null {
    return this.connections.get(userId) || null;
  }

  broadcastToRoom(roomId: string, message: any, excludeUserId?: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const messageStr = JSON.stringify(message);

    for (const userId of room.users) {
      if (userId !== excludeUserId) {
        const ws = this.connections.get(userId);
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr);
        }
      }
    }
  }

  sendToUser(userId: string, message: any): void {
    const ws = this.connections.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  getStats(): {
    rooms: number;
    users: number;
    connections: number;
    messages: number;
  } {
    return {
      rooms: this.rooms.size,
      users: this.users.size,
      connections: this.connections.size,
      messages: Array.from(this.rooms.values()).reduce((sum, room) => sum + room.messages.length, 0),
    };
  }
}

// ============================================================================
// WEBSOCKET CHAT API
// ============================================================================

export class WebSocketChatAPI {
  private roomManager: ChatRoomManager;
  private server?: ReturnType<typeof serve>;

  constructor() {
    this.roomManager = new ChatRoomManager();
  }

  private async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Health check
      if (url.pathname === '/health' && method === 'GET') {
        const stats = this.roomManager.getStats();
        return Response.json({
          status: 'healthy',
          websocket: 'available',
          stats,
          timestamp: new Date().toISOString(),
        }, { headers: corsHeaders });
      }

      // Get rooms
      if (url.pathname === '/api/rooms' && method === 'GET') {
        const rooms = this.roomManager.getAllRooms().map(room => ({
          id: room.id,
          name: room.name,
          description: room.description,
          isPrivate: room.isPrivate,
          userCount: room.users.size,
          maxUsers: room.maxUsers,
        }));

        return Response.json({ rooms }, { headers: corsHeaders });
      }

      // Get room messages
      if (url.pathname.startsWith('/api/rooms/') && method === 'GET') {
        const roomId = url.pathname.replace('/api/rooms/', '');
        const limit = parseInt(url.searchParams.get('limit') || '50');

        const messages = this.roomManager.getRoomMessages(roomId, limit);
        const room = this.roomManager.getRoom(roomId);

        if (!room) {
          return Response.json(
            { error: 'Room not found' },
            { status: 404, headers: corsHeaders }
          );
        }

        return Response.json({
          room: {
            id: room.id,
            name: room.name,
            description: room.description,
            userCount: room.users.size,
          },
          messages,
        }, { headers: corsHeaders });
      }

      // Get online users
      if (url.pathname === '/api/users/online' && method === 'GET') {
        const roomId = url.searchParams.get('room');
        const users = this.roomManager.getOnlineUsers(roomId || undefined);

        return Response.json({
          users: users.map(user => ({
            id: user.id,
            username: user.username,
            avatar: user.avatar,
            room: user.room,
            connectedAt: user.connectedAt,
            lastActivity: user.lastActivity,
          })),
          count: users.length,
        }, { headers: corsHeaders });
      }

      // WebSocket upgrade
      if (url.pathname === '/ws' && request.headers.get('upgrade') === 'websocket') {
        const upgradeSuccess = this.server?.upgrade(request, {
          data: {
            authenticated: false,
          } as WebSocketData,
        });

        if (upgradeSuccess) {
          return new Response(null, { status: 101 });
        }
      }

      // 404 for unknown routes
      return Response.json(
        { error: 'Endpoint not found' },
        { status: 404, headers: corsHeaders }
      );

    } catch (error) {
      console.error('Request error:', error);
      return Response.json(
        { error: 'Internal server error' },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  // ============================================================================
  // WEBSOCKET HANDLERS
  // ============================================================================

  private handleWebSocketOpen = (ws: WebSocket) => {
    console.log('🔌 WebSocket connection opened');
  };

  private handleWebSocketMessage = (ws: WebSocket, message: string) => {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'auth':
          this.handleAuth(ws, data);
          break;

        case 'join':
          this.handleJoin(ws, data);
          break;

        case 'leave':
          this.handleLeave(ws);
          break;

        case 'message':
          this.handleMessage(ws, data);
          break;

        case 'private_message':
          this.handlePrivateMessage(ws, data);
          break;

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;

        default:
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Unknown message type',
            receivedType: data.type,
          }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format',
      }));
    }
  };

  private handleWebSocketClose = (ws: any, code: number, reason: string) => {
    const userId = ws.data.userId;
    if (userId) {
      this.roomManager.removeUser(userId);
      console.log(`🔌 WebSocket closed for user ${userId} (code: ${code})`);
    }
  };

  private handleAuth(ws: any, data: any): void {
    const { userId, username, avatar } = data;

    if (!userId || !username) {
      ws.send(JSON.stringify({
        type: 'auth_error',
        message: 'userId and username are required',
      }));
      return;
    }

    // Add user to room manager
    const user = this.roomManager.addUser({
      id: userId,
      username,
      avatar,
      room: data.room || 'general',
    });

    // Register connection
    this.roomManager.registerConnection(userId, ws);

    // Update WebSocket data
    ws.data.userId = userId;
    ws.data.authenticated = true;
    ws.data.room = user.room;

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'auth_success',
      user,
      rooms: this.roomManager.getAllRooms().map(room => ({
        id: room.id,
        name: room.name,
        userCount: room.users.size,
      })),
    }));

    // Broadcast join message
    this.roomManager.broadcastToRoom(user.room, {
      type: 'user_joined',
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
      },
      room: user.room,
      timestamp: Date.now(),
    });

    console.log(`✅ User authenticated: ${username} (${userId})`);
  }

  private handleJoin(ws: any, data: any): void {
    const { roomId, password } = data;
    const userId = ws.data.userId;

    if (!userId || !ws.data.authenticated) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Authentication required',
      }));
      return;
    }

    const result = this.roomManager.joinRoom(userId, roomId, password);

    if (!result.success) {
      ws.send(JSON.stringify({
        type: 'join_error',
        message: result.error,
        roomId,
      }));
      return;
    }

    // Update WebSocket data
    ws.data.room = roomId;

    // Send room info and recent messages
    const messages = this.roomManager.getRoomMessages(roomId, 20);
    const users = this.roomManager.getOnlineUsers(roomId);

    ws.send(JSON.stringify({
      type: 'joined_room',
      room: {
        id: result.room!.id,
        name: result.room!.name,
        description: result.room!.description,
        userCount: result.room!.users.size,
      },
      messages,
      users: users.map(user => ({
        id: user.id,
        username: user.username,
        avatar: user.avatar,
      })),
    }));

    // Broadcast join message to room
    this.roomManager.broadcastToRoom(roomId, {
      type: 'user_joined',
      user: {
        id: userId,
        username: this.roomManager.getRoom(roomId)?.users.has(userId) ?
          Array.from(this.roomManager.getOnlineUsers(roomId)).find(u => u.id === userId)?.username : 'Unknown',
      },
      room: roomId,
      timestamp: Date.now(),
    }, userId);
  }

  private handleLeave(ws: any): void {
    const userId = ws.data.userId;
    const roomId = ws.data.room;

    if (userId && roomId) {
      // Broadcast leave message
      this.roomManager.broadcastToRoom(roomId, {
        type: 'user_left',
        userId,
        room: roomId,
        timestamp: Date.now(),
      });

      this.roomManager.leaveCurrentRoom(userId);
    }

    ws.data.room = undefined;
    ws.send(JSON.stringify({ type: 'left_room' }));
  }

  private handleMessage(ws: any, data: any): void {
    const userId = ws.data.userId;
    const roomId = ws.data.room;

    if (!userId || !ws.data.authenticated || !roomId) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Authentication and room required',
      }));
      return;
    }

    const user = Array.from(this.roomManager.getOnlineUsers(roomId)).find(u => u.id === userId);
    if (!user) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'User not found in room',
      }));
      return;
    }

    // Update user activity
    this.roomManager.updateUserActivity(userId);

    // Create message
    const message = this.roomManager.addMessage({
      type: 'message',
      userId,
      username: user.username,
      content: data.content,
      room: roomId,
      replyTo: data.replyTo,
      mentions: data.mentions,
    });

    // Broadcast to room
    this.roomManager.broadcastToRoom(roomId, {
      type: 'message',
      message,
    });
  }

  private handlePrivateMessage(ws: any, data: any): void {
    const userId = ws.data.userId;
    const targetUserId = data.targetUserId;

    if (!userId || !ws.data.authenticated || !targetUserId) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Authentication and target user required',
      }));
      return;
    }

    const sender = Array.from(this.roomManager.getOnlineUsers()).find(u => u.id === userId);
    if (!sender) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Sender not found',
      }));
      return;
    }

    // Send private message
    this.roomManager.sendToUser(targetUserId, {
      type: 'private_message',
      from: {
        id: sender.id,
        username: sender.username,
        avatar: sender.avatar,
      },
      content: data.content,
      timestamp: Date.now(),
    });

    // Confirm to sender
    ws.send(JSON.stringify({
      type: 'private_message_sent',
      to: targetUserId,
      content: data.content,
      timestamp: Date.now(),
    }));
  }

  // ============================================================================
  // SERVER LIFECYCLE
  // ============================================================================

  start(port: number = 3007): void {
    this.server = serve({
      port,
      hostname: 'localhost',
      fetch: this.handleRequest.bind(this),
      websocket: {
        open: this.handleWebSocketOpen as any,
        message: this.handleWebSocketMessage as any,
        close: this.handleWebSocketClose as any,
      },
      error: (error) => {
        console.error('Server error:', error);
        return new Response('Internal Server Error', { status: 500 });
      }
    });

    console.log(`💬 WebSocket Chat API Server running at http://localhost:${port}`);
    console.log('\n📋 Available Endpoints:');
    console.log('  GET  /health                    - Health check with chat stats');
    console.log('  GET  /api/rooms                 - Get all chat rooms');
    console.log('  GET  /api/rooms/:id             - Get room messages');
    console.log('  GET  /api/users/online          - Get online users');
    console.log('  WS   /ws                        - WebSocket chat connection');
    console.log('\n💬 WebSocket Message Types:');
    console.log('  • auth: {userId, username, avatar?, room?}');
    console.log('  • join: {roomId, password?}');
    console.log('  • leave: {}');
    console.log('  • message: {content, replyTo?, mentions?}');
    console.log('  • private_message: {targetUserId, content}');
    console.log('  • ping: {}');
    console.log('\n🚀 Connect with a WebSocket client to start chatting!');
  }

  stop(): void {
    if (this.server) {
      this.server.stop();
      console.log('🛑 Chat server stopped');
    }
  }

  getStats(): {
    rooms: number;
    users: number;
    connections: number;
    messages: number;
  } {
    return this.roomManager.getStats();
  }
}

// ============================================================================
// DEMO EXECUTION
// ============================================================================

if (import.meta.main) {
  const chatAPI = new WebSocketChatAPI();

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    chatAPI.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\nShutting down gracefully...');
    chatAPI.stop();
    process.exit(0);
  });

  chatAPI.start();
}

export type { ChatUser, ChatMessage, ChatRoom, WebSocketData };