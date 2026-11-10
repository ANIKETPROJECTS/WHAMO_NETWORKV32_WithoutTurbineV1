# MongoDB URI Creation Guide

This guide explains two ways to create the MongoDB connection URI needed by the WHAMO Network Designer:

1. **MongoDB Atlas** — MongoDB hosted for you in the cloud.
2. **MongoDB Community Server on an Ubuntu VPS** — MongoDB installed on the same VPS as the application.

The application reads the URI from the `MONGODB_URI` environment variable. See [installationguide.md](installationguide.md) for where to set it when deploying the application.

> **Keep the URI private.** It contains a database username and password. Do not commit it to Git, include it in screenshots, paste it into public support requests, or print it in application logs. If it is exposed, change the database user's password and update the application's environment variable.

## What a MongoDB URI contains

An Atlas URI generally looks like this:

```text
mongodb+srv://<database-user>:<url-encoded-password>@<cluster-host>/whamo?retryWrites=true&w=majority
```

A MongoDB server running on the same Ubuntu VPS as the application can use:

```text
mongodb://<database-user>:<url-encoded-password>@127.0.0.1:27017/whamo?authSource=whamo
```

Replace every placeholder with your own values. `whamo` is the database name used in these examples; MongoDB creates it when the application first writes data. The username and password are the **MongoDB database user's** credentials, not your MongoDB Atlas website login.

If a username or password contains reserved characters such as `$ : / ? # [ ] @`, percent-encode those characters before putting the value in a URI. For example, `@` becomes `%40`. A randomly generated hexadecimal password avoids these characters.

---

## Option 1: Create a URI with MongoDB Atlas

Atlas hosts and maintains MongoDB. Your application connects to it over an encrypted network connection.

### Step 1: Create an Atlas project and database deployment

1. Sign in to [MongoDB Atlas](https://cloud.mongodb.com/), or create an Atlas account.
2. Create a project for this application.
3. Create a database deployment in the project. Choose a region appropriate for your application server.
4. Wait for the deployment to finish provisioning.

Atlas plan availability and limits can vary by region and account. Review the options shown in your Atlas account before creating a deployment.

### Step 2: Add the application's server IP address

1. In Atlas, open the project's **Network Access** or **IP Access List** settings.
2. Add the public outbound IP address of the server where the WHAMO application will run.
3. If your hosting provider uses a fixed outbound IP, use that address. If it uses changing outbound IPs, arrange a stable address or private network connection with the provider.

Do not allow connections from every IP address (`0.0.0.0/0`) for a production database. Your laptop's IP address alone is not enough if the application runs on a separate VPS.

### Step 3: Create a database user

1. Open Atlas **Database Access** (sometimes labelled **Database Users**).
2. Add a database user with a unique username and a strong password.
3. Grant the user read and write access only to the `whamo` database, if the Atlas role options allow database-specific access.
4. Save the password securely. If you lose it, reset it in Atlas and update `MONGODB_URI`.

Database users are separate from Atlas website users.

### Step 4: Copy the Atlas connection string

1. Open your database deployment and select **Connect**.
2. Choose the option for connecting an application or driver.
3. Copy the Atlas-provided connection string. It normally starts with `mongodb+srv://`.
4. Replace the username and password placeholders with the database user's credentials.
5. Put `whamo` after the cluster hostname as the database name. Keep any query options supplied by Atlas.

The completed URI should have this general form:

```text
mongodb+srv://<database-user>:<url-encoded-password>@<cluster-host>/whamo?retryWrites=true&w=majority
```

Use the exact cluster hostname and options supplied by Atlas; do not copy the example hostname above.

### Step 5: Set `MONGODB_URI` on the application server

On Ubuntu, the existing installation guide stores application settings in `/etc/whamo/whamo.env`:

```bash
sudo nano /etc/whamo/whamo.env
```

Add or update this line without surrounding quotes:

```text
MONGODB_URI=mongodb+srv://<database-user>:<url-encoded-password>@<cluster-host>/whamo?retryWrites=true&w=majority
```

Replace the example with your real Atlas URI. Keep the file restricted to the application service account, then restart the app:

```bash
sudo chown root:whamo /etc/whamo/whamo.env
sudo chmod 0640 /etc/whamo/whamo.env
sudo systemctl restart whamo
sudo systemctl status whamo
sudo journalctl -u whamo -n 100 --no-pager
```

The logs should show that the application connected to MongoDB. Do not paste the URI into the terminal as a diagnostic command or share the full logs publicly if they might contain secrets.

---

## Option 2: Install MongoDB on the Ubuntu VPS

This option installs MongoDB on the same VPS as the WHAMO application. The URI then uses `127.0.0.1`, so the database does not need to be exposed to the public internet.

These instructions follow MongoDB's official Ubuntu APT installation steps for Ubuntu 22.04 (Jammy) and Ubuntu 24.04 (Noble), using MongoDB Community Server 9.0. Check the official installation page if using a different Ubuntu release or CPU architecture:

- [Install MongoDB Community Edition on Ubuntu](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/)
- [MongoDB security checklist](https://www.mongodb.com/docs/manual/administration/security-checklist/)

### Step 1: Check the Ubuntu release

Connect to the VPS over SSH and run:

```bash
lsb_release -a
```

The repository commands below are for Ubuntu 22.04 (`jammy`) or 24.04 (`noble`). Do not use a repository codename that does not match the server's Ubuntu release.

### Step 2: Add MongoDB's official package repository

Install the required tools and import MongoDB's package-signing key:

```bash
sudo apt-get update
sudo apt-get install -y gnupg curl
curl -fsSL https://pgp.mongodb.com/server-9.asc | \
  sudo gpg -o /usr/share/keyrings/mongodb-server-9.gpg --dearmor
```

For **Ubuntu 24.04 (Noble)**, add the repository:

```bash
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-9.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/9.0 multiverse" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-9.0.list
```

For **Ubuntu 22.04 (Jammy)**, use this repository line instead:

```bash
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-9.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/9.0 multiverse" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-9.0.list
```

Update the package list and install MongoDB:

```bash
sudo apt-get update
sudo apt-get install -y mongodb-org
```

### Step 3: Start MongoDB and keep it local-only

Start MongoDB and enable it to start automatically after a reboot:

```bash
sudo systemctl start mongod
sudo systemctl enable mongod
sudo systemctl status mongod
mongod --version
```

MongoDB's default configuration binds to `127.0.0.1`, which allows connections only from the same server. Keep this setting when the application and database share the VPS. **Do not change it to `0.0.0.0` or open port `27017` to the public internet.**

If MongoDB is already running and you changed its configuration, reload it with:

```bash
sudo systemctl restart mongod
```

### Step 4: Create the first MongoDB administrator

Open the MongoDB shell locally:

```bash
mongosh
```

Create a MongoDB administrator account. The `passwordPrompt()` function asks for the password without placing it in the command itself:

```javascript
use admin
db.createUser({
  user: "whamo_admin",
  pwd: passwordPrompt(),
  roles: [{ role: "userAdminAnyDatabase", db: "admin" }]
})
```

Use a strong unique password and store it securely. This administrator is for database administration; the web application will use a separate, restricted account.

### Step 5: Turn on authentication

Edit MongoDB's configuration:

```bash
sudo nano /etc/mongod.conf
```

Ensure the configuration includes these settings. Preserve the existing indentation and do not create duplicate `security` or `net` sections:

```yaml
net:
  bindIp: 127.0.0.1
  port: 27017

security:
  authorization: enabled
```

Restart MongoDB:

```bash
sudo systemctl restart mongod
sudo systemctl status mongod
```

### Step 6: Create an application database user

Connect as the administrator. MongoDB will prompt for the password:

```bash
mongosh --host 127.0.0.1 --port 27017 \
  --username whamo_admin \
  --authenticationDatabase admin \
  --password
```

At the MongoDB prompt, create an application user that can read and write only to the `whamo` database:

```javascript
use whamo
db.createUser({
  user: "whamo_app",
  pwd: passwordPrompt(),
  roles: [{ role: "readWrite", db: "whamo" }]
})
```

Choose a strong password. To avoid URI-encoding issues, you can generate a hexadecimal password on the VPS with:

```bash
openssl rand -hex 32
```

Keep the generated password private and enter it when `passwordPrompt()` asks. A hex password contains no URI-reserved characters. If you choose a different password containing reserved characters, URL-encode those characters before putting it in the URI.

### Step 7: Build the local connection URI

Because the application user was created in the `whamo` database, set the authentication database to `whamo`:

```text
mongodb://whamo_app:<password>@127.0.0.1:27017/whamo?authSource=whamo
```

Replace `<password>` with the application user's actual password. Do not include the angle brackets.

### Step 8: Put the URI in the app's private environment file

Add the completed URI to the environment file used by the application service:

```bash
sudo nano /etc/whamo/whamo.env
```

The setting should look like this, with your own password:

```text
MONGODB_URI=mongodb://whamo_app:<password>@127.0.0.1:27017/whamo?authSource=whamo
```

Save the file and ensure its permissions are restricted:

```bash
sudo chown root:whamo /etc/whamo/whamo.env
sudo chmod 0640 /etc/whamo/whamo.env
sudo systemctl restart whamo
sudo systemctl status whamo
sudo journalctl -u whamo -n 100 --no-pager
```

Confirm the app starts and its logs report a MongoDB connection. Do not expose the URI in screenshots, logs, or shell history.

---

## If the database is on a different server

The local URI using `127.0.0.1` works only when the application and MongoDB are on the same machine. If they are on separate servers:

1. Prefer a private network connection between the application server and database server.
2. Bind MongoDB only to the database server's private interface, not every interface.
3. Enable authentication and TLS.
4. Configure the firewall to allow TCP port `27017` only from the application server's private IP.
5. Use the database server's private hostname or IP in a standard `mongodb://` URI.
6. Do not expose an unauthenticated MongoDB port to the public internet.

For many deployments, Atlas is simpler and safer than exposing a self-managed database server.

## Troubleshooting

### `MONGODB_URI environment variable is not set`

Check that the URI is set in the environment file used by the running app service and restart the service. The project expects the exact name `MONGODB_URI`.

### Authentication failed

Check the database username, password, and `authSource`. A user created in the `whamo` database needs `authSource=whamo`; an Atlas URI should retain the Atlas-provided options and use the database user credentials.

### Atlas connection times out

Confirm the application's outbound IP is in the Atlas IP access list, the deployment is available, and outbound TCP access to the Atlas database hosts is allowed.

### Local MongoDB connection is refused

On the Ubuntu VPS, check `sudo systemctl status mongod` and confirm the URI points to `127.0.0.1:27017`. Keep MongoDB bound to localhost when the app is on the same VPS.

## References

- [MongoDB Atlas: Connect to a database deployment](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/)
- [MongoDB connection string formats](https://www.mongodb.com/docs/manual/reference/connection-string/)
- [MongoDB Community Edition installation on Ubuntu](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/)
- [MongoDB security checklist](https://www.mongodb.com/docs/manual/administration/security-checklist/)
