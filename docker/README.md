# Docker Configurations

## Directory Layout

```
docker/
├── README.md
├── docker-compose.prod.yml    ← Production overrides
└── nginx/
    ├── Dockerfile.nginx       ← Production nginx image
    └── nginx.conf             ← Production nginx reverse proxy config
```

Individual Dockerfiles live in their service directories:
- `services/crm/Dockerfile` — Backend (FastAPI on Python 3.12)
- `apps/crm-frontend/Dockerfile` — Frontend (Next.js standalone)

## Development

Use the base compose file directly:

```bash
cp .env.example .env
docker compose up --build
```

Access the app at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs

## Production

Use the production override file for hardened deployment:

```bash
# 1. Configure production environment
cp .env.example .env
# Edit .env with strong secrets, real CORS origins, etc.

# 2. Start with production overrides
docker compose -f docker-compose.yml -f docker/docker-compose.prod.yml up -d --build
```

### What the production override does

| Feature | Development | Production |
|---|---|---|
| Entry point | Direct port 3000 / 8000 | nginx on :80/:443 |
| Restart policy | `unless-stopped` | `always` |
| Resource limits | None | CPU + memory limits |
| Logging | stdout text | JSON files with rotation |
| Backend logging | `LOG_FORMAT=text` | `LOG_FORMAT=json`, uvicorn `--log-level warning` |
| Backend workers | 1 (uvicorn default) | Configurable via `UVICORN_WORKERS` (default: 2) |
| DB/Redis ports | Exposed to host | DB: localhost only; Redis: internal only |
| Backup labels | None | `com.crm.backup.target: true` on volumes |
| SSL | No | Uncomment the HTTPS block in `nginx/nginx.conf` + certbot |

### SSL Setup (Production)

1. Set your domain in `.env` (`DOMAIN=your-domain.com`)
2. Uncomment the HTTPS server block in `docker/nginx/nginx.conf`
3. Run certbot to obtain certificates:
   ```bash
   docker compose -f docker-compose.yml -f docker/docker-compose.prod.yml exec nginx certbot --nginx -d your-domain.com
   ```

See `../README.md` for full project documentation.
