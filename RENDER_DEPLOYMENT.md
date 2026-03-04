# Deploy to Render - Single Project (Backend + Frontend)

This guide shows you how to deploy both backend and frontend together on Render as a single web service.

## Architecture

```
Render Web Service
├── Backend (Express API) - Port 10000
└── Frontend (React Build) - Served by Express
```

The backend serves the API endpoints AND the built React frontend files.

## Prerequisites

1. GitHub account
2. Render account (free tier available)
3. MongoDB Atlas database (already configured)
4. Your code pushed to GitHub

## Step 1: Push Code to GitHub

```bash
cd login-app
git init
git add .
git commit -m "Initial commit - Login application"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## Step 2: Create Render Account

1. Go to [Render.com](https://render.com)
2. Sign up with GitHub
3. Authorize Render to access your repositories

## Step 3: Create New Web Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure the service:

### Basic Settings:
- **Name**: `login-app` (or your choice)
- **Region**: Choose closest to you
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`

### Build Settings:
- **Build Command**: 
  ```bash
  npm install && npm run build
  ```
- **Start Command**: 
  ```bash
  npm start
  ```

### Instance Type:
- Select **Free** tier

## Step 4: Environment Variables

Click "Advanced" and add these environment variables:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Required |
| `PORT` | `10000` | Render default |
| `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
| `SECRET_KEY` | Generate new key | Use: `node scripts/generateSecretKey.js` |
| `FRONTEND_URL` | `*` | Allow all origins (or use your Render URL) |

### Your MongoDB URI:
```
mongodb+srv://nithishniki27_db_user:WbZL42MPu35EhulR@cluster0.3ozsdul.mongodb.net/loginapp
```

## Step 5: Deploy

1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Render will:
   - Install backend dependencies
   - Build frontend (React)
   - Start the server
   - Serve both API and frontend

## Step 6: Access Your App

Once deployed, you'll get a URL like:
```
https://login-app-xxxx.onrender.com
```

- **Frontend**: `https://login-app-xxxx.onrender.com/`
- **API**: `https://login-app-xxxx.onrender.com/login`
- **Health Check**: `https://login-app-xxxx.onrender.com/health`

## Step 7: Create First User

### Option 1: Using Render Shell
1. Go to your service dashboard
2. Click "Shell" tab
3. Run:
```bash
cd backend
node scripts/createUser.js admin admin123
```

### Option 2: Using Register Endpoint
Open your app and click "Create New Account"

## How It Works

### Development Mode:
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173` (separate Vite server)
- CORS enabled for cross-origin requests

### Production Mode (Render):
- Backend serves API at `/login`, `/register`, etc.
- Backend also serves React build files
- Everything on same domain (no CORS issues)
- Single URL for entire application

## File Structure

```
login-app/
├── backend/
│   ├── server.js          # Serves API + Frontend
│   ├── package.json       # Build script included
│   └── ...
├── frotend/
│   ├── dist/             # Built files (created during deploy)
│   └── ...
└── render.yaml           # Render configuration
```

## Build Process on Render

1. **Install backend dependencies**:
   ```bash
   cd backend && npm install
   ```

2. **Build frontend**:
   ```bash
   npm run build
   # This runs: cd ../frotend && npm install && npm run build
   ```

3. **Start server**:
   ```bash
   npm start
   # Server serves API + frontend/dist files
   ```

## Troubleshooting

### Build Failed
- Check build logs in Render dashboard
- Ensure all dependencies are in package.json
- Verify MongoDB URI is correct

### Can't Connect to Database
1. Go to MongoDB Atlas
2. Network Access → Add IP: `0.0.0.0/0` (allow all)
3. Redeploy on Render

### 404 Errors
- Make sure `NODE_ENV=production` is set
- Check that frontend build succeeded
- Verify `dist` folder was created

### API Not Working
- Check environment variables are set
- View logs in Render dashboard
- Test health endpoint: `/health`

## Update Your App

After making changes:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Render will automatically redeploy!

## Free Tier Limitations

- App sleeps after 15 minutes of inactivity
- First request after sleep takes ~30 seconds
- 750 hours/month free
- Upgrade to paid plan for always-on service

## Cost Optimization

**Free Tier** (Current setup):
- ✅ Single web service
- ✅ MongoDB Atlas free tier
- ✅ Total cost: $0/month

**Paid Tier** ($7/month):
- Always-on service
- No cold starts
- Better performance

## Alternative: Separate Deployments

If you prefer separate deployments:

### Backend (Render):
- Root Directory: `backend`
- Build: `npm install`
- Start: `npm start`

### Frontend (Vercel/Netlify):
- Root Directory: `frotend`
- Build: `npm run build`
- Output: `dist`
- Update API URL in frontend code

## Security Checklist

Before going live:

- ✅ Strong SECRET_KEY generated
- ✅ MongoDB Atlas IP whitelist configured
- ✅ Environment variables set
- ✅ NODE_ENV=production
- ✅ HTTPS enabled (automatic on Render)
- ✅ Rate limiting active
- ✅ Helmet security headers enabled
- ✅ MongoDB injection protection enabled

## Monitoring

### Check Health:
```bash
curl https://your-app.onrender.com/health
```

### View Logs:
1. Go to Render dashboard
2. Select your service
3. Click "Logs" tab

### Metrics:
- CPU usage
- Memory usage
- Request count
- Response times

## Custom Domain (Optional)

1. Buy domain (Namecheap, GoDaddy, etc.)
2. In Render dashboard:
   - Settings → Custom Domains
   - Add your domain
   - Update DNS records as instructed
3. SSL certificate auto-generated

## Backup Strategy

### Database Backups:
- MongoDB Atlas: Automatic backups (free tier)
- Download backup: Atlas Dashboard → Clusters → Backup

### Code Backups:
- GitHub repository (already backed up)
- Clone locally regularly

## Support

- **Render Docs**: https://render.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com
- **Issues**: Check Render dashboard logs

---

## Quick Deploy Checklist

- [ ] Code pushed to GitHub
- [ ] Render account created
- [ ] Web service created
- [ ] Environment variables set
- [ ] MongoDB Atlas IP whitelist updated
- [ ] Deployment successful
- [ ] Health check passes
- [ ] First user created
- [ ] Login tested
- [ ] Register tested

**Your app is now live! 🚀**
