# WHAMO Network Designer — VPS Installation Guide

This guide covers the main WHAMO Network Designer application in the project root. It has a React/Vite web interface, an Express/Node.js server, and a MongoDB database. The separate WHAMO Visualization viewer is optional and is covered at the end.

The examples use Ubuntu Linux and Windows Server. Replace example paths, domain names, and database values with your own. Do not put passwords, connection strings, or signing keys in Git.

## Important production checks

Complete these checks before making the application available on the public internet:

1. **Replace the development accounts.** On startup, the current application seeds default administrator and demo accounts. Change or remove that behavior in `server/auth/inMemoryUserStore.ts`, and establish a unique administrator account before public access. Do not rely on development defaults.
2. **Rotate credentials stored in the existing PM2 example.** `ecosystem.config.cjs` contains hard-coded deployment credentials. Do not use it as-is. Rotate the database credential and signing secret, then provide new values through the server's environment instead.
3. **Use a production MongoDB deployment.** The application requires `MONGODB_URI`. Restrict database access to the VPS, use a dedicated database user with only the required permissions, and enable backups.
4. **Set a private signing secret.** Set `JWT_SECRET` to a newly generated, random value. The application accepts `SESSION_SECRET` as a fallback, but `JWT_SECRET` is preferred.
5. **Use HTTPS.** Keep the Node.js port private behind Nginx or IIS; expose the website through HTTPS.
6. **WHAMO execution is optional.** The application can create input files and view output files without a server-side WHAMO engine. Server-side `.OUT` generation requires a properly licensed `WHAMO.EXE` and a compatible runtime. The Windows instructions below explain a limitation in the current execution handler.

## 1. Linux VPS (Ubuntu)

These steps assume Ubuntu 22.04 or 24.04 and a domain name pointing to the VPS.

### 1.1 Prepare the server

Connect over SSH, then install the basic tools and Node.js:

```bash
sudo apt update
sudo apt install -y ca-certificates curl git nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

Use a currently supported Node.js LTS release. The project was configured in Replit with Node.js 20; run the production build and smoke test if using a newer runtime.

Create a DNS `A` record for your domain (for example, `whamo.example.com`) that points to the VPS public IPv4 address. Add an `AAAA` record only if the VPS has working public IPv6.

### 1.2 Create an application account and copy the project

Create a restricted Linux service account and application directory:

```bash
sudo useradd --system --create-home --home-dir /opt/whamo \
  --shell /usr/sbin/nologin whamo
sudo mkdir -p /opt/whamo/app
sudo chown -R whamo:whamo /opt/whamo
```

Clone the repository (or copy the project release archive) into `/opt/whamo/app`:

```bash
sudo -u whamo git clone <REPOSITORY_URL> /opt/whamo/app
```

Install dependencies and build the production app:

```bash
cd /opt/whamo/app
sudo -u whamo npm ci
sudo -u whamo npm run build
```

The build creates `dist/index.cjs` and the static site under `dist/public`. Install the full dependency set before building; the build uses development dependencies such as Vite.

### 1.3 Configure MongoDB and application secrets

Create a MongoDB database and user, then allow connections from the VPS's outbound IP address in the database provider's network settings. Keep the database password URL-encoded inside the connection string if it contains special characters.

Create a private environment file outside the project directory:

```bash
sudo install -d -m 0750 -o root -g whamo /etc/whamo
sudo nano /etc/whamo/whamo.env
```

Add these values, replacing the placeholders:

```text
MONGODB_URI=mongodb+srv://<database-user>:<url-encoded-password>@<cluster>/<database>?retryWrites=true&w=majority
JWT_SECRET=<random-secret>
PORT=5000
```

Generate a signing secret on the VPS and copy its output into the `JWT_SECRET` value:

```bash
openssl rand -base64 48
```

Save and restrict the environment file:

```bash
sudo chown root:whamo /etc/whamo/whamo.env
sudo chmod 0640 /etc/whamo/whamo.env
```

Do not commit this file or print its contents into logs or support messages.

### 1.4 Create a systemd service

Find the Node.js path:

```bash
command -v node
```

Create the service definition:

```bash
sudo nano /etc/systemd/system/whamo.service
```

Use this configuration, changing the `ExecStart` Node.js path if `command -v node` returned a different one:

```ini
[Unit]
Description=WHAMO Network Designer
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=whamo
Group=whamo
WorkingDirectory=/opt/whamo/app
EnvironmentFile=/etc/whamo/whamo.env
Environment=NODE_ENV=production
ExecStart=/usr/bin/node /opt/whamo/app/dist/index.cjs
Restart=on-failure
RestartSec=5
UMask=0077
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

Enable and start it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now whamo
sudo systemctl status whamo
sudo journalctl -u whamo -n 100 --no-pager
```

The app listens on port `5000` by default (or the `PORT` value in the environment). Confirm the service starts and connects to MongoDB before configuring the public proxy.

### 1.5 Configure Nginx and HTTPS

Create an Nginx site:

```bash
sudo nano /etc/nginx/sites-available/whamo
```

Replace `whamo.example.com` with your domain:

```nginx
server {
    listen 80;
    server_name whamo.example.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable and test the site:

```bash
sudo ln -s /etc/nginx/sites-available/whamo /etc/nginx/sites-enabled/whamo
sudo nginx -t
sudo systemctl reload nginx
```

Install a TLS certificate with Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d whamo.example.com
```

If UFW is enabled, allow SSH before enabling the firewall, and expose only SSH and web traffic:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

Do not open port `5000` to the public internet. The public site should be served through Nginx over HTTPS.

### 1.6 Check the installation

Open `https://whamo.example.com/login` in a browser. Check the service logs if it does not load:

```bash
sudo journalctl -u whamo -f
```

Confirm that MongoDB is reachable and that the production account setup from **Important production checks** is complete before inviting users.

## 2. Windows Server

These steps install the main Designer on Windows Server. The commands below use PowerShell. Use a supported 64-bit Windows Server release.

### 2.1 Install prerequisites and copy the project

1. Install a supported 64-bit Node.js LTS release and Git for Windows.
2. Create a MongoDB database and user. Allow the Windows Server's outbound IP address in the database provider's network settings.
3. Create a project directory such as `C:\Apps\WHAMO`.
4. Open PowerShell and clone the repository:

```powershell
cd C:\Apps
git clone <REPOSITORY_URL> WHAMO
cd C:\Apps\WHAMO
node --version
npm --version
npm ci
npm run build
```

### 2.2 Set production environment variables

Set the machine-level variables using **System Properties → Advanced → Environment Variables**. Add:

- `MONGODB_URI` — the MongoDB connection string
- `JWT_SECRET` — a newly generated random signing secret
- `PORT` — `5000`
- `NODE_ENV` — `production`

You can generate a signing secret with Node.js:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

Store the generated value in the protected server configuration; do not commit it or leave it in shell history. Machine-level variables are available to local administrators, so restrict administrative access to the server. Open a new PowerShell window after setting them.

### 2.3 Smoke-test the application

Start the production server directly:

```powershell
cd C:\Apps\WHAMO
node .\dist\index.cjs
```

In a browser on the server, open `http://127.0.0.1:5000/login`. Keep the PowerShell window open during this test. Stop the test process with `Ctrl+C` after confirming the page and MongoDB connection work.

**Windows command note:** the project's `npm start` script uses Unix-style environment assignment, so use `node .\dist\index.cjs` for Windows service startup unless that script is made cross-platform.

### 2.4 Run it as a Windows service

Use a Windows service wrapper such as NSSM or WinSW so the app starts automatically and restarts after a failure. For NSSM:

1. Install NSSM from its official distribution and open an elevated Command Prompt.
2. Run `nssm install WHAMO-Designer` and configure:
   - **Application path:** the path to `node.exe` (commonly `C:\Program Files\nodejs\node.exe`)
   - **Startup directory:** `C:\Apps\WHAMO`
   - **Arguments:** `dist\index.cjs`
3. Confirm the system environment variables from step 2.2 are set. Restart the service after changing them.
4. In the service's I/O settings, optionally direct stdout and stderr to a restricted log directory.
5. Start the service and verify it in Windows Services or with:

```powershell
nssm start WHAMO-Designer
nssm status WHAMO-Designer
```

### 2.5 Put IIS in front of the app

Do not expose port `5000` directly. Use IIS as the public HTTPS endpoint:

1. Install the IIS Web Server role.
2. Install the IIS URL Rewrite module and Application Request Routing (ARR), then enable proxying in ARR.
3. Create an IIS site for your domain and bind a valid TLS certificate to HTTPS.
4. Add a `web.config` file in the site's physical root with this reverse-proxy rule:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="WHAMO Designer reverse proxy" stopProcessing="true">
          <match url="(.*)" />
          <action type="Rewrite" url="http://127.0.0.1:5000/{R:1}" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

5. In Windows Defender Firewall, allow inbound HTTPS (and HTTP only if you use it to redirect to HTTPS). Do not create a public inbound rule for port `5000`.
6. Open `https://your-domain.example/login` and check the service logs if the page does not load.

### 2.6 Windows WHAMO engine limitation

The current server-side output handler launches `wine` and expects the engine at `server/engines/WHAMO.EXE`. Wine is a Linux compatibility layer and is not available as a native Windows service dependency. Therefore, `.OUT` generation from the web server will not work on Windows Server without changing the handler to launch the licensed Windows executable natively. Until then, run WHAMO through an approved local installation and load its output file into the viewer.

## 3. Optional: deploy the standalone WHAMO Visualization viewer

The standalone viewer is a separate static web app under `GRAPHVISUALIZATIONCODE/artifacts/whamo-viewer`. It can be hosted on a separate subdomain such as `viewer.example.com`; it does not need a Node.js application service after building.

### Linux build

Install Corepack/pnpm if needed, then build from the workspace:

```bash
cd /opt/whamo/app/GRAPHVISUALIZATIONCODE
corepack enable
pnpm install --frozen-lockfile
PORT=3001 BASE_PATH=/ pnpm --filter @workspace/whamo-viewer run build
```

The static output is:

```text
GRAPHVISUALIZATIONCODE/artifacts/whamo-viewer/dist/public
```

Point an Nginx static site for `viewer.example.com` at that directory and add HTTPS as in the Linux steps above.

### Windows build

From PowerShell:

```powershell
cd C:\Apps\WHAMO\GRAPHVISUALIZATIONCODE
corepack enable
pnpm install --frozen-lockfile
$env:PORT = "3001"
$env:BASE_PATH = "/"
pnpm --filter @workspace/whamo-viewer run build
```

The same `artifacts\whamo-viewer\dist\public` directory can be set as the physical path for a separate IIS site with HTTPS.

## 4. Optional server-side WHAMO execution on Linux

The server-side `.OUT` endpoint requires all of the following:

1. A WHAMO executable that you are authorized to use on the server.
2. A compatible Wine installation.
3. The executable at `server/engines/WHAMO.EXE`, relative to the application directory.
4. A service account allowed to execute it and write temporary files under the project's `temp` directory.

The executable is not included in this project. Confirm licensing and compatibility with the WHAMO supplier or project authority before installation. If these conditions are not met, the Designer can still generate `.INP` files and users can load separately generated `.OUT` files.

## 5. Updating the installation

Before upgrading, back up the MongoDB database and any project files that are stored outside MongoDB. Then pull the approved release, reinstall dependencies, rebuild, and restart the service.

**Ubuntu:**

```bash
cd /opt/whamo/app
sudo -u whamo git pull
sudo -u whamo npm ci
sudo -u whamo npm run build
sudo systemctl restart whamo
sudo systemctl status whamo
```

**Windows:** update the project files, run `npm ci` and `npm run build` from PowerShell, then restart the `WHAMO-Designer` service. Check the service logs and verify both the login page and MongoDB connection after every update.
