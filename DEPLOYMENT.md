# Deployment Guide for Render

This guide will help you deploy the Campus Connect application to Render.

## Prerequisites

1. A Render account (sign up at https://render.com)
2. A MongoDB database (MongoDB Atlas recommended for production)
3. Cloudinary account for image storage
4. Supabase account for OAuth authentication

## Deployment Steps

### 1. Backend Deployment

#### Option A: Using Render Dashboard

1. Go to your Render dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `campus-connect-api`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Root Directory**: Leave empty (or set to `backend` if deploying from subdirectory)

5. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=10000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   SUPABASE_JWT_SECRET=your_supabase_jwt_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   CORS_ORIGIN=https://your-frontend-url.onrender.com
   GOOGLE_CLIENT_ID=your_google_client_id (optional)
   GOOGLE_CLIENT_SECRET=your_google_client_secret (optional)
   ```

6. Click "Create Web Service"

#### Option B: Using render.yaml (Recommended)

1. Push your code to GitHub
2. In Render dashboard, click "New +" → "Blueprint"
3. Connect your repository
4. Render will automatically detect `render.yaml` and create services

### 2. Frontend Deployment

#### Option A: Static Site (Recommended for Expo Web)

1. Go to your Render dashboard
2. Click "New +" → "Static Site"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `campus-connect-web`
   - **Build Command**: `npm install && npm run build:web`
   - **Publish Directory**: `web-build`
   - **Environment**: `Node`

5. Add Environment Variables:
   ```
   EXPO_PUBLIC_API_URL=https://campus-connect-api.onrender.com/api
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

#### Option B: Web Service (Alternative)

1. Click "New +" → "Web Service"
2. Configure:
   - **Name**: `campus-connect-web`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build:web`
   - **Start Command**: `npm run serve:web`
   - **Root Directory**: Leave empty

### 3. Environment Variables Setup

#### Backend Environment Variables

Create a `.env` file in the `backend` directory with:

```env
NODE_ENV=production
PORT=10000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/campus-connect?retryWrites=true&w=majority
JWT_SECRET=your_secure_jwt_secret_key_here
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CORS_ORIGIN=https://campus-connect-web.onrender.com
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

#### Frontend Environment Variables

These should be set in Render dashboard:

```env
EXPO_PUBLIC_API_URL=https://campus-connect-api.onrender.com/api
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. MongoDB Atlas Setup

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Create a database user
4. Whitelist Render's IP addresses (or use 0.0.0.0/0 for all IPs in development)
5. Get your connection string and add it to `MONGO_URI`

### 5. Update Frontend API URL

After backend is deployed, update the frontend config:

1. Get your backend URL from Render (e.g., `https://campus-connect-api.onrender.com`)
2. Update `EXPO_PUBLIC_API_URL` in Render dashboard to: `https://campus-connect-api.onrender.com/api`

### 6. Update Supabase Redirect URLs

1. Go to your Supabase project settings
2. Add your frontend URL to allowed redirect URLs:
   - `https://campus-connect-web.onrender.com`
   - `https://campus-connect-web.onrender.com/login`

### 7. Deploy

1. Push your code to GitHub
2. Render will automatically build and deploy
3. Check build logs for any errors
4. Test your API at `https://your-api-url.onrender.com/health`
5. Test your frontend at `https://your-frontend-url.onrender.com`

## Post-Deployment Checklist

- [ ] Backend health check endpoint works (`/health`)
- [ ] Frontend loads correctly
- [ ] API calls from frontend work
- [ ] OAuth login works
- [ ] Image uploads work
- [ ] CORS is configured correctly
- [ ] Environment variables are set correctly

## Troubleshooting

### Backend Issues

1. **Build fails**: Check Node.js version (should be 18+)
2. **Database connection fails**: Verify `MONGO_URI` and IP whitelist
3. **Port issues**: Render uses `PORT` environment variable automatically

### Frontend Issues

1. **Build fails**: Check if all dependencies are in `package.json`
2. **API calls fail**: Verify `EXPO_PUBLIC_API_URL` is correct
3. **CORS errors**: Update `CORS_ORIGIN` in backend to include frontend URL

### Common Errors

- **"Cannot find module"**: Ensure all dependencies are in `package.json`
- **"Port already in use"**: Render handles this automatically, don't hardcode ports
- **"MongoDB connection failed"**: Check connection string and network access

## Notes

- Render free tier services spin down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds
- Consider upgrading to paid tier for production use
- Use environment variables for all sensitive data
- Never commit `.env` files to Git

