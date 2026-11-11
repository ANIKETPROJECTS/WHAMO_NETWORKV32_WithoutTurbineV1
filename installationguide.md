# WHAMO Network Designer — VPS Installation Guide

This guide covers the main WHAMO Network Designer application in the project root. It has a React/Vite web interface, an Express/Node.js server, and a MongoDB database. The separate WHAMO Visualization viewer is optional and is covered at the end.

The examples use Ubuntu Linux and Windows Server. Replace example paths, domain names, and database values with your own. Do not put passwords, connection strings, or signing keys in Git.

## Important production checks

Complete these checks before making the application available on the public internet:

1. **Replace the development accounts.** On startup, the current application seeds default administrator and demo accounts. Change or remove that behavior in `server/auth/inMemoryUserStore.ts`, and establish a unique administrator account before public access. Do not rely on development defaults.
2. **Rotate previously exposed credentials.** An earlier version of `ecosystem.config.cjs` contained a database password and signing secret. Treat those values as exposed: replace the MongoDB password and use a new `JWT_SECRET`. The current PM2 config reads secrets from the environment instead of storing them in the project.
3. **Use a production MongoDB deployment.** The application requires `MONGODB_URI`. Restrict database network access to the application server and enable backups. See [mongodb-uri-creation-guide.md](mongodb-uri-creation-guide.md) for Atlas and Ubuntu MongoDB setup.
4. **Set a private signing secret.** Set `JWT_SECRET` to a newly generated, random value. The application accepts `SESSION_SECRET` as a fallback, but `JWT_SECRET` is preferred.
5. **Use HTTPS.** Keep the Node.js port private behind Nginx or IIS; expose the website through HTTPS.
6. **Install the WHAMO runtime on Ubuntu.** The app runs the 32-bit Windows WHAMO engine with Wine inside Xvfb for headless `.OUT` generation. Install Wine's 32-bit support, Xvfb, and `xauth` as described below. The Windows instructions explain why the current server-side handler is Linux-only.

## 1. Linux VPS (Ubuntu)

These steps assume Ubuntu 22.04 or 24.04 and a domain name pointing to the VPS.

### 1.1 Prepare the server

Connect over SSH, then install the basic tools and Node.js:

```bash
sudo apt update
sudo apt install -y ca-certificates curl git nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install --global pm2
sudo dpkg --add-architecture i386
sudo apt update
sudo apt install -y wine wine32:i386 wine64 xvfb xauth
node --version
npm --version
pm2 --version
wine --version
xvfb-run --help
```

Use a currently supported Node.js LTS release. The project was configured in Replit with Node.js 20; run the production build and smoke test if using a newer runtime.

Create a DNS `A` record for your domain (for example, `whamo.example.com`) that points to the VPS public IPv4 address. Add an `AAAA` record only if the VPS has working public IPv6.

The bundled WHAMO executable is a 32-bit Windows console program. Initialize Wine as the same Linux account that will run PM2:

```bash
xvfb-run -a wineboot --init
```

This creates Wine's initial compatibility environment under that account's home directory. Do not run this as `root` if PM2 will run as your normal SSH login.

### 1.2 Clone the project and build it

Use your normal SSH login account; these instructions do not create a separate Linux service user. Clone the repository into a folder in your home directory:

```bash
cd "$HOME"
git clone <REPOSITORY_URL> WHAMO
cd "$HOME/WHAMO"
npm install
npm run build
```

The build creates `dist/index.cjs` and the static site under `dist/public`.

### 1.3 Set the database URI and signing secret

Create the MongoDB URI using [mongodb-uri-creation-guide.md](mongodb-uri-creation-guide.md). Create a private environment file in your home directory, outside the cloned project:

```bash
nano "$HOME/.whamo.env"
```

Add the following lines, replacing the MongoDB URI with your real URI and the JWT secret with a fresh random value:

```text
MONGODB_URI='mongodb+srv://<database-user>:<url-encoded-password>@<cluster-host>/whamo?retryWrites=true&w=majority'
JWT_SECRET='paste-the-generated-secret-here'
PORT=3006
```

Replace the sample URI with the one you created, then generate a signing secret:

```bash
openssl rand -base64 48
```

Paste the generated value into `JWT_SECRET`, save the file, and restrict access to it:

```bash
chmod 600 "$HOME/.whamo.env"
```

Do not commit this file or print its contents into logs or support messages.

### 1.4 Start the application with PM2

Load the private environment values into your shell, then start the app with the repository's PM2 configuration:

```bash
set -a
source "$HOME/.whamo.env"
set +a
cd "$HOME/WHAMO"
pm2 start ecosystem.config.cjs
pm2 status
```

The PM2 config sets the app name to `whamo-app`, listens on port `3006`, and enables Xvfb for WHAMO runs. The server handler starts each simulation through `xvfb-run -a wine whamo.exe`; do not wrap `pm2 start` itself in `xvfb-run`. Check the application logs:

```bash
pm2 logs whamo-app
```

Configure PM2 to restart the app after a server reboot. Run:

```bash
pm2 startup
```

PM2 prints a command beginning with `sudo`; copy and run that exact command, then save the running app list:

```bash
pm2 save
```

The PM2 process list contains the environment that was loaded when the app started. Keep the PM2 home directory private. Whenever you change `.whamo.env`, reload it and update the running process:

```bash
set -a
source "$HOME/.whamo.env"
set +a
pm2 restart whamo-app --update-env
pm2 save
```

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
        proxy_pass http://127.0.0.1:3006;
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

Do not open port `3006` to the public internet. The public site should be served through Nginx over HTTPS.

### 1.6 Check the installation

Open `https://whamo.example.com/login` in a browser. Check the PM2 logs if it does not load:

```bash
pm2 logs whamo-app
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

## 4. Server-side WHAMO execution

On Ubuntu, the application runs the bundled 32-bit `server/engines/WHAMO.EXE` using Wine. For a headless VPS, the PM2 config enables `WHAMO_USE_XVFB`, and the handler runs Wine inside `xvfb-run -a` for each simulation. This requires the `wine32:i386`, `wine64`, `xvfb`, and `xauth` packages installed in step 1.1, and Wine initialized under the same Linux account that runs PM2.

If a WHAMO run fails, check `pm2 logs whamo-app` and confirm `wine --version`, `xvfb-run --help`, and `xvfb-run -a wineboot --init` succeed when run as the PM2 account. The engine also needs permission to write to the project's `temp` directory.

The WHAMO executable is included in this project. Confirm you are authorized to deploy and run it on the VPS. The current server-side execution handler invokes Wine and is intended for Linux; Windows Server requires a separate native-Windows implementation.

## 5. Updating the installation

Before upgrading, back up the MongoDB database and any project files that are stored outside MongoDB. Then pull the approved release, reinstall dependencies, rebuild, and restart the service.

**Ubuntu:**

```bash
cd "$HOME/WHAMO"
git pull
npm install
npm run build
set -a
source "$HOME/.whamo.env"
set +a
pm2 restart whamo-app --update-env
pm2 save
pm2 status
```

**Windows:** update the project files, run `npm ci` and `npm run build` from PowerShell, then restart the `WHAMO-Designer` service. Check the service logs and verify both the login page and MongoDB connection after every update.
