import { DurableObject } from "cloudflare:workers";
import type { Song } from "~/types";
import { data } from "./seed";

export const SONGS_DO_STORAGE_KEY = "songs";

export class SongsDo extends DurableObject {
  sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.seed();
  }

  private seed(): void {
    this.sql.exec(`CREATE TABLE IF NOT EXISTS songs(
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      title     TEXT,
      upvotes   INTEGER,
      downvotes INTEGER
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

  detail(id: number): Song {
    return this.sql.exec<Song>(`SELECT * FROM songs WHERE id = ?;`, id).one();
  }

  upvote(id: number): Song {
    this.sql.exec(`UPDATE songs SET upvotes = upvotes + 1 WHERE id = ?;`, id);
    return this.detail(id);
  }

  downvote(id: number): Song {
    this.sql.exec(
      `UPDATE songs SET downvotes = downvotes + 1 WHERE id = ?;`,
      id,
    );
    return this.detail(id);
  }
}
