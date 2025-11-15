# Deployment Guide for Render

This guide will walk you through deploying NovaMind AI to Render (free hosting).

## Prerequisites

- GitHub account
- Render account (https://render.com - sign up free)
- MongoDB Atlas account (https://www.mongodb.com/cloud/atlas - free tier)
- Groq API key (https://console.groq.com/keys - free)

## Step 1: Setup MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up/Login and create a **FREE** cluster
3. Choose **AWS** as provider, select region closest to you
4. Wait for cluster creation (5-10 minutes)
5. Click **"Connect"** → **"Connect your application"**
6. Copy connection string: `mongodb+srv://username:<password>@cluster.mongodb.net/novamind`
7. Replace `<password>` with your actual password
8. Go to **Network Access** → **"Add IP Address"** → **"Allow Access from Anywhere"** (0.0.0.0/0)

## Step 2: Push Code to GitHub

```bash
cd c:\Dev\AI project\NovaMind
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

## Step 3: Deploy Backend on Render

### Create Web Service

1. Login to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Click **"Connect account"** and authorize GitHub
4. Find your repository: `AI_NovaMind`
5. Click **"Connect"**

### Configure Backend Service

**Basic Settings:**
- **Name:** `novamind-backend` (or any name you like)
- **Region:** Choose closest region (e.g., Oregon)
- **Branch:** `main`
- **Root Directory:** `Backend`
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

**Advanced Settings:**
- **Plan:** Free
- **Auto-Deploy:** Yes (enabled by default)

### Add Environment Variables

Click **"Advanced"** → Scroll to **"Environment Variables"**

Add these variables:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | `mongodb+srv://...` (from Step 1) |
| `GROQ_API_KEY` | `gsk_...` (your Groq API key) |
| `PORT` | `5000` |
| `NODE_ENV` | `production` |

**Important:** Don't add `FRONTEND_URL` yet - we'll add it after deploying frontend.

### Deploy Backend

1. Click **"Create Web Service"**
2. Wait 5-10 minutes for build and deployment
3. Check logs for any errors
4. Once deployed, you'll see: **"Your service is live 🎉"**
5. **Copy your backend URL** (e.g., `https://novamind-backend.onrender.com`)

### Test Backend

Visit: `https://your-backend-url.onrender.com/test`

You should see: `{"message": "Server is working!"}`

## Step 4: Deploy Frontend on Render

### Create Static Site

1. Click **"New +"** → **"Static Site"**
2. Connect your repository again: `AI_NovaMind`
3. Click **"Connect"**

### Configure Frontend Service

**Basic Settings:**
- **Name:** `novamind-frontend` (or any name)
- **Branch:** `main`
- **Root Directory:** `Frontend`
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`

**Advanced Settings:**
- **Plan:** Free
- **Auto-Deploy:** Yes

### Add Environment Variable

Click **"Advanced"** → **"Environment Variables"**

Add this variable:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://novamind-backend.onrender.com` |

⚠️ **Replace** with YOUR actual backend URL from Step 3!

### Deploy Frontend

1. Click **"Create Static Site"**
2. Wait 5-10 minutes for build
3. Once deployed, **copy your frontend URL** (e.g., `https://novamind-frontend.onrender.com`)

## Step 5: Update Backend CORS

Now we need to tell the backend to allow requests from the frontend.

1. Go back to your **backend service** on Render dashboard
2. Click **"Environment"** tab on the left
3. Click **"Add Environment Variable"**
4. Add:
   - **Key:** `FRONTEND_URL`
   - **Value:** Your frontend URL (e.g., `https://novamind-frontend.onrender.com`)
5. Click **"Save Changes"**
6. Backend will automatically redeploy (takes 2-3 minutes)

## Step 6: Test Your Live Application

1. Visit your frontend URL: `https://your-frontend-url.onrender.com`
2. Click **"Guest Mode"** or register a new account
3. Test features:
   - ✅ Send a message → Should get AI response
   - ✅ Click microphone icon → Test voice input
   - ✅ Upload an image → Test image analysis
   - ✅ Create new chat thread
   - ✅ Delete a chat thread

## Troubleshooting

### Backend Issues

**"No such file or directory" or "ENOENT: package.json" error:**
- Make sure **Root Directory** is set to `Backend` (case-sensitive!)
- Build Command should be: `npm install`
- Start Command should be: `npm start`
- Don't use `cd Backend` in commands when Root Directory is set

**"Service Unavailable" or 503 error:**
- Render free tier services sleep after 15 minutes
- First request takes 30-60 seconds to wake up
- Wait and refresh

**MongoDB connection failed:**
```
Check Render logs:
1. Go to backend service → "Logs" tab
2. Look for: "Failed to connect with Db"
3. Verify MongoDB URI is correct
4. Check MongoDB Atlas Network Access allows 0.0.0.0/0
5. Verify MongoDB user has read/write permissions
```

**"GROQ_API_KEY not found":**
- Check environment variables are saved
- Make sure there are no extra spaces
- Redeploy service after adding variables

### Frontend Issues

**Can't connect to backend / CORS errors:**
```
1. Open browser console (F12)
2. Check if API_URL is correct:
   - Should be: https://novamind-backend.onrender.com
   - Not: http://localhost:5000
3. Verify VITE_API_URL environment variable in frontend
4. Check FRONTEND_URL is set in backend
5. Redeploy both services
```

**"Failed to fetch" errors:**
- Backend might be sleeping (wait 30 seconds)
- Check backend is running: Visit `/test` endpoint
- Verify VITE_API_URL doesn't have trailing slash

### Database Issues

**Users can't login after deployment:**
- Users from local MongoDB don't exist in Atlas
- Create new account on production
- Or migrate data using mongodump/mongorestore

**Conversations not saving:**
```
Check Render logs for errors:
1. Backend service → Logs tab
2. Look for MongoDB errors
3. Verify MONGODB_URI is correct
4. Check MongoDB Atlas connection limits
```

## Important Notes

⚠️ **Free Tier Limitations:**
- Backend sleeps after 15 min inactivity
- 750 hours/month free (enough for one service 24/7)
- Database has 512MB limit on Atlas free tier

⚠️ **First Load is Slow:**
- Free services take 30-60 seconds to wake from sleep
- Subsequent requests are fast
- Consider paid plan for production use

⚠️ **Image Analysis:**
- May not work (Groq vision models decommissioned)
- Consider using Google Gemini Vision API
- Or disable the feature

## Updating Your Deployment

When you make code changes:

```bash
# Push to GitHub
git add .
git commit -m "Your changes"
git push origin main

# Render automatically redeploys!
```

Both services will automatically redeploy when you push to `main` branch.

## Cost Estimate

**Current Setup (Free):**
- Render Backend: $0/month (free tier)
- Render Frontend: $0/month (free tier)
- MongoDB Atlas: $0/month (free tier)
- Groq API: $0/month (free tier)

**Total: $0/month** 🎉

**Upgrade Options:**
- Render Starter: $7/month (no sleep, better performance)
- MongoDB Atlas M10: $57/month (better performance)
- Custom domain: ~$12/year

## Support

If you encounter issues:

1. Check Render logs first
2. Verify all environment variables
3. Test backend `/test` endpoint
4. Open browser console (F12) for frontend errors
5. Create GitHub issue with error logs

## Next Steps

After successful deployment:

- [ ] Set up custom domain
- [ ] Add password hashing (bcrypt)
- [ ] Implement rate limiting
- [ ] Add email verification
- [ ] Set up monitoring alerts
- [ ] Configure backup strategy

## Security Recommendations

Before going to production:

1. **Hash passwords:** Use bcrypt in auth routes
2. **Add rate limiting:** Prevent API abuse
3. **Enable HTTPS only:** Already enabled on Render
4. **Validate inputs:** Add input sanitization
5. **Secure MongoDB:** Use strong passwords
6. **Environment secrets:** Never commit .env files

---

**Congratulations!** 🎉 Your AI chatbot is now live on the internet!

Share your link: `https://your-frontend-url.onrender.com`
