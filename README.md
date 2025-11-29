# Songs Backend

A Cloudflare Workers backend API for managing songs with voting functionality.

## Infrastructure

- **Cloudflare Workers** - Serverless runtime for handling HTTP requests
- **Durable Objects** - Persistent storage for song data with stateful operations
- **itty-router** - Lightweight routing for request handling

The application uses a single Durable Object instance to maintain song state, ensuring consistent data access across all requests.
