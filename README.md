![Release Version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgithub.com%2Fflur34%2Fflur34%2Fraw%2Fmain%2Fpackage.json&query=%24.version&style=flat&label=Version&link=https%3A%2F%2Fgithub.com%2Fflur34%2Fflur34%2Freleases%2Flatest)
![License](https://img.shields.io/github/license/flurbudurbur/kurosearch?style=flat&link=https%3A%2F%2Fgithub.com%2Fflurbudurbur%2Fkurosearch%2Fblob%2Fmain%2FLICENSE)

<img src="/src/lib/assets/logo.svg" alt="Flur34 Logo" width="300" style="color:hsl(344.91,82.38%,37.84%);"/>

# Flur34

A Project that aims to containerize Kurosearch to jork it in privacy. Self-host it if you want!

## Tag explanation

| Tag            | Description                         |              Website              |
| :------------- | :---------------------------------- | :-------------------------------: |
| `latest`       | Latest stable release (recommended) |   [stable](https://flur34.com)    |
| `canary`       | Latest development build            | [canary](https://beta.flur34.com) |
| `x.y.z[-rc.n]` | Specific release                    |                                   |

## Getting Started

Go to the [docker repo](https://github.com/flur34/flur34-composer) and read the instructions!

This repo is simply the source for the docker container. If you wish to develop (awesome!), then make use of the node
scripts in the `package.json`.

## Valkey Configuration

The `/api/sync` endpoint uses Valkey (Redis-compatible) for in-memory storage of synchronization codes. This replaces the previous file-based approach with several benefits:

- Automatic expiration with TTL (no cleanup needed)
- Better performance with connection pooling
- Reduced storage footprint with compression
- Atomic one-time use operations
- Observable with metrics/logging

### Environment Variables

Configure Valkey using these environment variables in your `.env` file:

```bash
# Enable/disable Valkey (default: true)
VALKEY_ENABLED=true

# Valkey server connection details
VALKEY_HOST=localhost      # Default: localhost
VALKEY_PORT=6379          # Default: 6379
VALKEY_PASSWORD=          # Optional: leave empty if no password
VALKEY_DB=0               # Default: 0
```

### Setup Instructions

1. Install and run Valkey or Redis:
   ```bash
   # Using Docker
   docker run -d -p 6379:6379 valkey/valkey:latest

   # Or using Redis
   docker run -d -p 6379:6379 redis:alpine
   ```

2. Copy `.env.example` to `.env` and configure Valkey settings if needed

3. The sync endpoint will automatically connect to Valkey on startup

### Graceful Degradation

If Valkey is unavailable or disabled:
- POST `/api/sync` returns 503 (Service Unavailable)
- GET `/api/sync/:code` returns 503 (Service Unavailable)
- Set `VALKEY_ENABLED=false` to explicitly disable the feature

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## Got Issues?

Open 'em up in the issues tab (preferably) or contact me. Info below.

Discord Server: [Discord](https://discord.gg/AxUnC7n9ZP)
