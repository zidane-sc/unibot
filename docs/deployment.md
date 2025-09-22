# Deployment with Docker

This project now ships with a multi-stage `Dockerfile` and a `docker-compose.yml` that wires the Next.js web app, the WhatsApp worker, and a Postgres database. The sections below cover local verification and a typical deployment flow to a Google Compute Engine (GCE) VM.

## 1. Prepare environment variables

1. Copy the sample file and adjust the values for your environment:

   ```bash
   cp .env.docker.example .env.docker
   ```

2. Update the copied file with strong secrets (`SESSION_SECRET`, `INTERNAL_API_SECRET`) and any custom domains.
3. (Optional) If you already use a root-level `.env` for local development, the compose file will still pick up the container-specific overrides from `.env.docker`.

## 2. Build & run locally

Use Docker Compose to build the images and start the stack:

```bash
docker compose up --build
```

This command builds the dedicated `web` and `worker` targets from the root `Dockerfile`, launches Postgres, and binds the services to:

- Web UI: http://localhost:3000
- Worker API: http://localhost:4000
- Postgres: localhost:5432 (username/password default to `postgres` unless overridden)

The worker state (Baileys auth files) is stored in the named volume `worker-state` so WhatsApp sessions persist across restarts.

Stop the stack with `docker compose down`. Add `-v` if you also want to remove the volumes.

## 3. Build production images

To build standalone images (without Compose):

```bash
docker build --target web -t gcr.io/PROJECT_ID/unibotz-web:latest .
docker build --target worker -t gcr.io/PROJECT_ID/unibotz-worker:latest .
```

Replace `PROJECT_ID` (and any other tags) as needed.

## 4. Push images to Artifact Registry (GCP)

1. Configure Docker to use gcloud as a credential helper:

   ```bash
   gcloud auth configure-docker REGION-docker.pkg.dev
   ```

2. Tag and push the images:

   ```bash
   docker push gcr.io/PROJECT_ID/unibotz-web:latest
   docker push gcr.io/PROJECT_ID/unibotz-worker:latest
   ```

You can also push to Docker Hub if you prefer; adjust the image names in `docker-compose.yml` accordingly.

## 5. Run on a Compute Engine VM

On the target VM (Debian/Ubuntu recommended):

1. Install Docker & Docker Compose Plugin.
2. Copy the project artifacts (at minimum `docker-compose.yml`, `.env.docker`, and the `Dockerfile` if you plan to rebuild on the VM). Example using gcloud:

   ```bash
   gcloud compute scp --recurse .env.docker docker-compose.yml YOUR_VM:~/unibotz
   ```

3. SSH into the VM, pull the images, and start the services:

   ```bash
   gcloud compute ssh YOUR_VM --command "cd ~/unibotz && docker compose pull"
   gcloud compute ssh YOUR_VM --command "cd ~/unibotz && docker compose up -d"
   ```

4. Expose ports 80/443 (or 3000/4000) via GCP firewall rules or an HTTPS load balancer. Update the `WEB_URL` in `.env.docker` to match the external hostname before starting the stack.

## 6. Maintenance notes

- **Database data** lives in the `postgres-data` volume. Snapshot the disk or use `docker compose exec postgres pg_dump` for backups.
- **WhatsApp session state** is persisted in the `worker-state` volume. Retain it when moving hosts to avoid re-linking the bot.
- To apply schema changes, run migrations from inside the `web` container:

  ```bash
  docker compose exec web pnpm --filter web prisma migrate deploy
  ```

- If you change dependencies, rebuild the images (`docker compose build web worker`).

With this setup you can iterate locally via Compose, then ship the same container images to your GCP VM for deployment.
