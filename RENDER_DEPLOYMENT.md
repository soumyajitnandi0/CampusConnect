# Render Deployment Guide

Quick guide to deploy Campus Connect to Render.

## Quick Start

### 1. Backend Deployment

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `campus-connect-api`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. Add Environment Variables (click "Advanced" → "Add Environment Variable"):

```
NODE_ENV=production
PORT=10000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secure_random_string
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CORS_ORIGIN=https://campus-connect-web.onrender.com
```

6. Click **"Create Web Service"**
7. Wait for deployment (takes 2-5 minutes)
8. Copy your service URL (e.g., `https://campus-connect-api.onrender.com`)

### 2. Frontend Deployment

1. In Render Dashboard, click **"New +"** → **"Static Site"**
2. Connect the same GitHub repository
3. Configure:
   - **Name**: `campus-connect-web`
   - **Root Directory**: Leave empty
   - **Build Command**: `npm install && npm run build:web`
   - **Publish Directory**: `web-build`
   - **Environment**: `Node`

4. Add Environment Variables:

```
EXPO_PUBLIC_API_URL=https://campus-connect-api.onrender.com/api
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Click **"Create Static Site"**
6. Wait for deployment

### 3. Update Backend CORS

After frontend is deployed:

1. Go to your backend service in Render
2. Edit environment variables
3. Update `CORS_ORIGIN` to your frontend URL:
   ```
   CORS_ORIGIN=https://campus-connect-web.onrender.com
   ```
4. Save and redeploy

### 4. Update Supabase Redirect URLs

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add to **Redirect URLs**:
   - `https://campus-connect-web.onrender.com`
   - `https://campus-connect-web.onrender.com/login`
3. Save

## Environment Variables Reference

### Backend Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | Secret for JWT tokens | Random 32+ character string |
| `SUPABASE_JWT_SECRET` | Supabase JWT secret | From Supabase dashboard |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | Cloudinary API key | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | From Cloudinary dashboard |
| `CORS_ORIGIN` | Frontend URL | `https://campus-connect-web.onrender.com` |

### Frontend Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | Backend API URL | `https://campus-connect-api.onrender.com/api` |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | From Supabase dashboard |

## MongoDB Atlas Setup

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster (M0)
3. Create database user (username/password)
4. Network Access → Add IP Address → Allow Access from Anywhere (`0.0.0.0/0`)
5. Database → Connect → Get connection string
6. Replace `<password>` with your database password
7. Use this as `MONGO_URI` in Render

## Testing Deployment

1. **Backend Health Check**: Visit `https://your-api.onrender.com/health`
   - Should return: `{"status":"ok","timestamp":"...","environment":"production"}`

2. **Frontend**: Visit `https://your-frontend.onrender.com`
   - Should load the app
   - Check browser console for errors

3. **API Connection**: Try logging in
   - Check Network tab for API calls
   - Verify they go to your backend URL

## Troubleshooting

### Backend won't start
- Check build logs in Render
- Verify all environment variables are set
- Check MongoDB connection string format

### Frontend build fails
- Ensure `build:web` script exists in `package.json`
- Check Node.js version (should be 18+)
- Verify all dependencies are in `package.json`

### CORS errors
- Update `CORS_ORIGIN` in backend to match frontend URL exactly
- Include protocol (`https://`) and no trailing slash

### API calls fail
- Verify `EXPO_PUBLIC_API_URL` is set correctly
- Check backend logs for errors
- Verify backend is running (check `/health` endpoint)

## Notes

- Free tier services spin down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- Use paid tier for production to avoid cold starts
- All environment variables are case-sensitive
- Never commit `.env` files to Git

## Next Steps

After deployment:
1. Test all features (login, events, clubs, chat)
2. Set up custom domain (optional, paid feature)
3. Enable auto-deploy from main branch
4. Set up monitoring/alerts
5. Configure backups for MongoDB

