import { DurableObject } from "cloudflare:workers";
import type {
  Comment,
  Song,
  SongWithComments,
  WebSocketMessage,
} from "~/types";
import { data } from "./seed";

export const SONGS_DO_STORAGE_KEY = "songs";

const MAX_COMMENTS = 50;

export class SongsDo extends DurableObject {
  private sql: SqlStorage;
  private sessions: Map<WebSocket, { [key: string]: string | number }>;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.seed();

    this.sessions = new Map();

    this.ctx.getWebSockets().forEach((ws) => {
      const attachment = ws.deserializeAttachment();
      if (attachment) {
        this.sessions.set(ws, { ...attachment });
      }
    });

    this.ctx.setWebSocketAutoResponse(
      new WebSocketRequestResponsePair("ping", "pong"),
    );
  }

  private seed(): void {
    this.sql.exec(`CREATE TABLE IF NOT EXISTS songs(
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      title     TEXT,
      upvotes   INTEGER,
      downvotes INTEGER
    );`);

    this.sql.exec(`CREATE TABLE IF NOT EXISTS comments(
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      song_id    INTEGER,
      text       TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (song_id) REFERENCES songs(id)
    );`);

    const existingSongs = this.sql.exec<Song>(`SELECT * FROM songs;`).toArray();
    if (existingSongs.length) {
      return;
    }

    for (const song of data) {
      this.sql.exec(
        `INSERT INTO songs (title, upvotes, downvotes) VALUES (?, ?, ?);`,
        song.title,
        song.upvotes,
        song.downvotes,
      );
    }
  }

  list(): Song[] {
    return this.sql.exec<Song>(`SELECT * FROM songs;`).toArray();
  }

  detail(id: number): SongWithComments {
    const song = this.sql
      .exec<Song>(`SELECT * FROM songs WHERE id = ?;`, id)
      .one();

    const comments = this.sql
      .exec<Comment>(
        `SELECT id, song_id, text, created_at FROM comments WHERE song_id = ? ORDER BY created_at DESC LIMIT ?;`,
        id,
        MAX_COMMENTS,
      )
      .toArray();

    return { ...song, comments };
  }

  upvote(id: number): void {
    this.sql.exec(`UPDATE songs SET upvotes = upvotes + 1 WHERE id = ?;`, id);
    const updatedSong = this.detail(id);
    this.broadcastUpdate(id, updatedSong);
  }

  downvote(id: number): void {
    this.sql.exec(
      `UPDATE songs SET downvotes = downvotes + 1 WHERE id = ?;`,
      id,
    );
    const updatedSong = this.detail(id);
    this.broadcastUpdate(id, updatedSong);
  }

  comment(id: number, text: string): void {
    this.sql.exec(
      `INSERT INTO comments (song_id, text) VALUES (?, ?);`,
      id,
      text,
    );
    const updatedSong = this.detail(id);
    this.broadcastUpdate(id, updatedSong);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url).pathname;
    const match = url.match(/^\/d\/(\d+)\/ws$/);
    if (!match) {
      return new Response("Invalid URL format", { status: 400 });
    }
    const songId = Number(match[1]);
    if (Number.isNaN(songId)) {
      return new Response("Invalid song ID", { status: 400 });
    }

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    this.ctx.acceptWebSocket(server);
    const wsId = crypto.randomUUID();
    server.serializeAttachment({ songId, wsId });

    this.sessions.set(server, { songId, wsId });

    try {
      const song = this.detail(songId);
      const message: WebSocketMessage = {
        type: "update",
        songId,
        data: song,
      };
      server.send(JSON.stringify(message));
    } catch (err) {
      const errorMessage: WebSocketMessage = {
        type: "error",
        message: err instanceof Error ? err.message : "Failed to fetch song",
      };
      server.send(JSON.stringify(errorMessage));
    }

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async webSocketClose(ws: WebSocket) {
    this.sessions.delete(ws);
    ws.close(1000, "Durable Object is closing WebSocket");
  }

  private broadcastUpdate(songId: number, song: SongWithComments): void {
    const relevantSessions = Array.from(this.sessions.keys()).filter(
      (ws) => this.sessions.get(ws)?.songId === songId,
    );
    if (!relevantSessions.length) {
      return;
    }

    const message: WebSocketMessage = {
      type: "update",
      songId,
      data: song,
    };
    const messageStr = JSON.stringify(message);

    const closedConnections: WebSocket[] = [];
    for (const ws of relevantSessions) {
      try {
        ws.readyState === WebSocket.READY_STATE_OPEN
          ? ws.send(messageStr)
          : closedConnections.push(ws);
      } catch {
        closedConnections.push(ws);
      }
    }

    for (const ws of closedConnections) {
      this.sessions.delete(ws);
    }
  }
}
