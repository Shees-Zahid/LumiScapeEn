# Deploying LumiScape on Hostinger (Business Hosting + Subdomain)

Everything runs as **one Node.js app** — the backend serves the React build.  
**Subdomain**: `lumiscapeen.businesssupporttech.com`  
**Parent domain** (`businesssupporttech.com`) is **not touched**.

---

## Step 1: Create a Free MongoDB Atlas Database

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and sign up / log in.
2. Click **Build a Database** → choose **M0 FREE** → pick a nearby region.
3. Create a database user (username + password — **no special characters** in the password).
4. Under **Network Access**, click **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`).
5. Back in **Database** → click **Connect** → **Drivers** → copy the connection string.
   It looks like: `mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/lumiscape?retryWrites=true&w=majority`

---

## Step 2: Create the Subdomain in hPanel

1. In hPanel → **Domains** → **Subdomains**.
2. Create the subdomain `lumiscapeen` (it will become `lumiscapeen.businesssupporttech.com`).
3. Note the **document root** path shown (e.g. `/home/u123456789/domains/lumiscapeen.businesssupporttech.com/public_html`).

> **Parent domain safety**: subdomains get their own isolated directory. Nothing under `businesssupporttech.com`'s `public_html` is modified.

---

## Step 3: Upload the Project Files

### Option A — Deploy Script (recommended)

Edit the top of `deploy.sh` with your real SSH credentials, then run:

```bash
# From Git Bash or WSL on Windows
bash deploy.sh
```

The script builds the frontend, uploads all files via `scp`, and installs backend dependencies on the server.

### Option B — via SSH (manual)

```bash
# SSH into your Hostinger server (find credentials in hPanel → Advanced → SSH Access)
ssh u123456789@your-server-ip -p 65002

# Navigate to your subdomain folder
cd ~/domains/lumiscapeen.businesssupporttech.com/public_html

# Clone the repo
git clone https://github.com/Shees-Zahid/LumiScapeEn.git .

# Install backend dependencies
cd backend
npm install --production

# Go back to root and install frontend dependencies + build
cd ..
npm install
npm run build
```

### Option C — via File Manager

1. Build locally: run `npm run build` in the project root.
2. Zip the entire project folder (**including** `dist/`, `backend/`, `node_modules/` from backend).
3. Upload the zip via hPanel → **File Manager** → navigate to `lumiscapeen.businesssupporttech.com`'s `public_html`.
4. Extract the zip there so the files sit directly inside `public_html/`.

---

## Step 4: Create the Backend `.env` File

In `public_html/backend/`, create a file named `.env`:

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/lumiscape?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_long_random_string_at_least_32_chars
JWT_EXPIRE=7d
CLIENT_URL=https://lumiscapeen.businesssupporttech.com
```

Replace the values with your actual MongoDB Atlas URI and a random JWT secret.

---

## Step 5: Set Up the Node.js App in hPanel

1. Go to hPanel → **Advanced** → **Node.js**.
2. Click **Create Application** and fill in:
   - **Node.js version**: 18.x or 20.x (latest LTS available)
   - **Application root**: `domains/lumiscapeen.businesssupporttech.com/public_html`
   - **Application URL**: select `lumiscapeen.businesssupporttech.com`
   - **Application startup file**: `backend/server.js`
3. Click **Create**.
4. After creation, scroll to **Environment Variables** and add:
   - `NODE_ENV` = `production`
5. Click **Restart** to start the app.

---

## Step 6: Enable SSL

1. In hPanel → **Security** → **SSL**.
2. Select `lumiscapeen.businesssupporttech.com` and install the free SSL certificate.
3. Wait a few minutes for propagation, then verify `https://lumiscapeen.businesssupporttech.com` works.

---

## Step 7: Seed Subscription Plans (Optional)

If you need default subscription plans in the database:

```bash
cd ~/domains/lumiscapeen.businesssupporttech.com/public_html
node backend/scripts/seedPlans.js
```

---

## Step 8: Verify

1. Visit `https://lumiscapeen.businesssupporttech.com` — you should see the login page.
2. Visit `https://lumiscapeen.businesssupporttech.com/api/health` — should return `{"status":"OK","message":"Server is running"}`.
3. Register your first admin account via the app or via API:
   ```bash
   curl -X POST https://lumiscapeen.businesssupporttech.com/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name":"Admin","email":"admin@businesssupporttech.com","password":"yourpassword","role":"super-admin"}'
   ```

---

## Updating After Code Changes

```bash
# Option 1: Re-run the deploy script
bash deploy.sh

# Option 2: Manual SSH
ssh -p 65002 u123456789@your-server-ip
cd ~/domains/lumiscapeen.businesssupporttech.com/public_html
git pull
npm run build
# Then restart the Node.js app in hPanel
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| 503 / Application Error | Check hPanel → Node.js → **Logs** for startup errors |
| MongoDB connection failed | Verify Atlas URI, check Atlas Network Access allows `0.0.0.0/0` |
| Blank page at subdomain | Make sure `dist/` folder exists with built files |
| API returns 404 | Verify startup file is set to `backend/server.js` |
| WebSocket/Chat not working | Shared hosting may limit WebSocket; consider upgrading to VPS |
| Parent site broken | Should not happen — subdomain files are completely isolated |

---

## Important Notes

- **Chat/WebSocket**: Hostinger shared hosting runs Node.js via Passenger, which has limited WebSocket support. The chat feature may not work reliably. If chat is critical, consider Hostinger VPS instead.
- **SSL**: Hostinger provides free SSL. Enable it in hPanel → **SSL** for your subdomain.
- **Parent domain**: Deploying to a subdomain does **not** affect `businesssupporttech.com` in any way.
