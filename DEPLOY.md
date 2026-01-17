# Deployment Instructions (DigitalOcean Self-Hosted)

This guide walks you through deploying your "Whole App" (Frontend + Supabase Backend) to a single DigitalOcean Droplet using Docker.

## 1. Provision a Droplet
1.  Log in to DigitalOcean.
2.  Create a new Droplet.
3.  **Image**: Ubuntu 22.04 LTS (or 24.04 LTS).
4.  **Size**: **4GB RAM / 2 CPUs** minimum (Basic Plan -> Regular or Premium Intel).
    *   *Warning*: The full Supabase stack is heavy. 1GB or 2GB Droplets will likely crash.
5.  **Authentication**: SSH Key (Recommended) or Password.
6.  Click **Create Droplet**.

## 2. Connect to the Droplet
Open your terminal and SSH into the server:
```bash
ssh root@<your-droplet-ip>
```

## 3. Install Docker
Run the following commands on the server to install Docker & Docker Compose:

```bash
# Update packages
apt-get update
apt-get install -y ca-certificates curl gnupg

# Add Docker's official GPG key:
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

## 4. Setup the Project
1.  **Clone your repository** (or copy files via SCP if you don't use Git):
    ```bash
    git clone https://github.com/your-username/your-repo.git crm-app
    cd crm-app
    ```

2.  **Configure Environment**:
    ```bash
    cp .env.example .env
    nano .env
    ```
    *   Set `VITE_SUPABASE_URL` to `http://<your-droplet-ip>:8000` (Use the Public IP!).
    *   Set `SUPABASE_PUBLIC_URL` to `http://<your-droplet-ip>:8000`.
    *   Generate a secure `JWT_SECRET` (use `openssl rand -hex 32`).
    *   Generate `ANON_KEY` and `SERVICE_ROLE_KEY` (Web tools available to sign JWTs with your secret, or use Supabase's local dev tools).
        *   *Tip*: For a quickstart, you can use the example keys provided in Supabase's self-hosting guide, but **change them for production**.

## 5. Start the Stack
```bash
docker compose up -d
```
This will pull all images (Supabase, Postgres, etc.) and build your Frontend app. It may take 5-10 minutes.

## 6. Access the App
*   **App**: `http://<your-droplet-ip>`
*   **Supabase Studio**: `http://<your-droplet-ip>:3000` (Default user/pass: admin/admin)
*   **API**: `http://<your-droplet-ip>:8000`

## Troubleshooting
*   **Check Logs**: `docker compose logs -f`
*   **Check Status**: `docker compose ps`
*   **Restart**: `docker compose restart`
