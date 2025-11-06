# Vercel Deployment Guide

This guide shows how to deploy NovaMind AI to Vercel (recommended: Frontend on Vercel + Backend on Render for best performance).

## 🎯 Recommended Deployment Strategy

**Frontend → Vercel** (Fast, Global CDN, Free)  
**Backend → Render** (No timeout limits, Better for AI APIs)

This hybrid approach gives you the best performance and avoids Vercel's 10-second serverless timeout.

---

## Option 1: Frontend on Vercel + Backend on Render (RECOMMENDED)

### Step 1: Deploy Backend on Render

Follow the **DEPLOYMENT.md** guide to deploy backend on Render first.

Once deployed, you'll have a backend URL like:
```
https://novamind-backend.onrender.com
```

### Step 2: Deploy Frontend on Vercel

#### A. Push Code to GitHub (if not already done)
```bash
cd "c:\Dev\AI project\NovaMind"
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

#### B. Deploy to Vercel

1. **Go to Vercel**
   - Visit: https://vercel.com
   - Click **"Sign Up"** or **"Login"**
   - Choose **"Continue with GitHub"**

2. **Import Repository**
   - Click **"Add New..."** → **"Project"**
   - Find your repository: **AI_NovaMind**
   - Click **"Import"**

3. **Configure Project**
   - **Framework Preset:** Vite
   - **Root Directory:** Click **"Edit"** → Enter: `Frontend`
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

4. **Add Environment Variable**
   - Click **"Environment Variables"**
   - Add variable:
     ```
     Name: VITE_API_URL
     Value: https://novamind-backend.onrender.com
     ```
     ⚠️ **Replace with YOUR actual Render backend URL!**
   
   - Select: **Production**, **Preview**, **Development** (check all)

5. **Deploy**
   - Click **"Deploy"**
   - Wait 2-3 minutes
   - ✅ **Done!** You'll get a URL like: `https://ai-novamind.vercel.app`

#### C. Update Backend CORS

1. Go back to **Render Dashboard**
2. Open your **backend service**
3. Go to **Environment** tab
4. Add/Update variable:
   ```
   FRONTEND_URL=https://ai-novamind.vercel.app
   ```
   (Use YOUR actual Vercel URL)
5. Save → Backend will auto-redeploy

#### D. Test Your App

Visit your Vercel URL: `https://ai-novamind.vercel.app`

Test all features:
- ✅ Login/Register
- ✅ Send messages
- ✅ Voice input
- ✅ Image upload
- ✅ Create/delete threads

---

## Option 2: Full Deployment on Vercel (Backend + Frontend)

⚠️ **Warning:** Vercel free tier has 10-second timeout for serverless functions. AI responses may fail.

### Prerequisites

You need to convert the Express backend to Vercel serverless functions.

#### Step 1: Create Vercel Configuration

Create `vercel.json` in the root directory:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "Backend/server.js",
      "use": "@vercel/node"
    },
    {
      "src": "Frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "Backend/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "Frontend/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

#### Step 2: Update Backend for Vercel

The current Express app needs modifications to work as a Vercel serverless function.

**Create:** `Backend/api/index.js`
```javascript
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import chatRoutes from "../routes/chat.js";
import authRoutes from "../routes/auth.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));

// Routes
app.use("/api", chatRoutes);
app.use("/api/auth", authRoutes);

// Test endpoint
app.get("/api/test", (req, res) => {
    res.json({ message: "Server is working on Vercel!" });
});

// MongoDB connection
let isConnected = false;

const connectDB = async () => {
    if (isConnected) return;
    
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        isConnected = true;
        console.log("Connected with Database!");
    } catch(err) {
        console.log("Failed to connect with Db", err);
    }
};

// Serverless function handler
export default async (req, res) => {
    await connectDB();
    return app(req, res);
};
```

#### Step 3: Update Frontend Build Script

Update `Frontend/package.json`:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "vercel-build": "npm run build"
  }
}
```

#### Step 4: Deploy to Vercel

1. **Push changes to GitHub:**
```bash
git add .
git commit -m "Configure for Vercel deployment"
git push origin main
```

2. **Import to Vercel:**
   - Go to https://vercel.com/new
   - Import your repository
   - **Root Directory:** Leave blank (monorepo detection)
   
3. **Add Environment Variables:**
   ```
   MONGODB_URI=mongodb+srv://mrshreyu7_db_user:PASSWORD@cluster0.tgbmade.mongodb.net/novamind?retryWrites=true&w=majority
   GROQ_API_KEY=your_groq_api_key_here
   PORT=5000
   NODE_ENV=production
   VITE_API_URL=/api
   ```
   
4. **Deploy**
   - Click **"Deploy"**
   - Wait for build completion

---

## Environment Variables Summary

### For Option 1 (Frontend on Vercel, Backend on Render)

**Vercel (Frontend):**
| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://novamind-backend.onrender.com` |

**Render (Backend):**
| Variable | Value |
|----------|-------|
| `MONGODB_URI` | `mongodb+srv://mrshreyu7_db_user:PASSWORD@cluster0.tgbmade.mongodb.net/novamind?retryWrites=true&w=majority` |
| `GROQ_API_KEY` | `your_groq_api_key_here` |
| `PORT` | `5000` |
| `FRONTEND_URL` | `https://ai-novamind.vercel.app` |

### For Option 2 (Full Stack on Vercel)

**Vercel:**
| Variable | Value |
|----------|-------|
| `MONGODB_URI` | `mongodb+srv://mrshreyu7_db_user:PASSWORD@cluster0.tgbmade.mongodb.net/novamind?retryWrites=true&w=majority` |
| `GROQ_API_KEY` | `your_groq_api_key_here` |
| `PORT` | `5000` |
| `NODE_ENV` | `production` |
| `VITE_API_URL` | `/api` |
| `FRONTEND_URL` | `https://your-project.vercel.app` |

---

## Custom Domain (Optional)

### Add Custom Domain to Vercel

1. Go to your project on Vercel
2. Click **"Settings"** → **"Domains"**
3. Enter your domain (e.g., `novamind.com`)
4. Follow DNS configuration instructions
5. Wait for SSL certificate (automatic)

---

## Troubleshooting

### Frontend Issues

**"Failed to fetch" errors:**
```
1. Check browser console (F12)
2. Verify VITE_API_URL is correct
3. Make sure it doesn't have trailing slash
4. Check if backend is accessible: visit /api/test
```

**Build fails:**
```
1. Check Vercel build logs
2. Verify package.json has correct scripts
3. Make sure all dependencies are listed
4. Check Node.js version (should be 18+)
```

### Backend Issues (Option 2)

**Timeout errors (10 seconds):**
```
This is Vercel's serverless limit.
Solution: Deploy backend on Render instead (Option 1)
```

**MongoDB connection issues:**
```
1. Check MongoDB Atlas Network Access
2. Allow 0.0.0.0/0 (all IPs)
3. Verify connection string is correct
4. Check MongoDB Atlas is not paused
```

**CORS errors:**
```
1. Add FRONTEND_URL environment variable
2. Make sure it matches your Vercel URL exactly
3. Don't include trailing slash
4. Redeploy backend after adding
```

### Performance Issues

**Slow first load:**
- Vercel edge network takes ~1-2 seconds
- Backend on Render may sleep (30-60 seconds first load)
- Subsequent loads are fast

**Solution for backend sleep:**
- Use Render's paid plan ($7/month) - no sleep
- Or use Vercel cron jobs to ping backend every 10 min
- Or deploy backend to Railway/Fly.io

---

## Automatic Deployments

Vercel automatically deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Vercel automatically deploys!
```

**Branch Deployments:**
- `main` branch → Production
- Other branches → Preview deployments
- Pull requests get unique URLs

---

## Monitoring & Analytics

### Enable Vercel Analytics

1. Go to your project
2. Click **"Analytics"** tab
3. Enable **Web Analytics** (free)
4. See visitor stats, page views, etc.

### Check Logs

1. Go to **"Deployments"**
2. Click on latest deployment
3. Click **"View Function Logs"**
4. See real-time logs

---

## Cost Comparison

### Vercel Pricing

**Free (Hobby):**
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Serverless functions (10s timeout)
- ✅ Automatic HTTPS
- ✅ Global CDN
- ❌ No custom build minutes limit
- **Cost: $0/month**

**Pro ($20/month):**
- ✅ All Hobby features
- ✅ 1TB bandwidth
- ✅ Longer function timeout (60s)
- ✅ Team collaboration
- ✅ Analytics
- **Cost: $20/month**

### Recommended Setup Cost

**Option 1 (Hybrid):**
- Vercel Frontend: $0/month
- Render Backend: $0/month (or $7 for no sleep)
- MongoDB Atlas: $0/month
- Groq API: $0/month
- **Total: $0-7/month**

---

## Next Steps After Deployment

- [ ] Add custom domain
- [ ] Enable Vercel Analytics
- [ ] Set up uptime monitoring
- [ ] Add error tracking (Sentry)
- [ ] Implement rate limiting
- [ ] Hash passwords with bcrypt
- [ ] Add email verification
- [ ] Set up automated backups

---

## Quick Commands

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from CLI
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# List deployments
vercel ls
```

---

## Support

**Vercel Issues:**
- Docs: https://vercel.com/docs
- Support: https://vercel.com/support

**Project Issues:**
- GitHub: https://github.com/shreyasme/AI_NovaMind/issues

---

**Congratulations!** 🎉 Your app is now live on Vercel!

**Recommended:** Use Option 1 (Frontend on Vercel + Backend on Render) for best performance and reliability!
