# Running Rentiverse in Cursor AI - Complete Setup Guide

## Prerequisites

1. **Node.js** (version 18 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify: `node --version` and `npm --version`

2. **Git** (for cloning and version control)
   - Download from [git-scm.com](https://git-scm.com/)

## Step 1: Extract and Setup Project

1. Extract the downloaded zip file to your desired location
2. Open the extracted folder in Cursor AI
3. Open terminal in Cursor AI (Terminal → New Terminal)

## Step 2: Install Dependencies

```bash
# Install all project dependencies
npm install

# If you encounter issues, try clearing cache first
npm cache clean --force
npm install
```

### Common Issue: cross-env not found

If you get an error about `cross-env` not being found:

```bash
# Install cross-env globally
npm install -g cross-env

# OR install it locally in the project
npm install cross-env --save-dev
```

## Step 3: Environment Setup

1. **Create `.env` file** in the root directory:

```env
# Database Configuration
DATABASE_URL=your_supabase_database_url_here

# Razorpay Configuration (for payments)
RAZORPAY_SECRET_KEY=your_razorpay_secret_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id

# Object Storage (if using file uploads)
DEFAULT_OBJECT_STORAGE_BUCKET_ID=your_bucket_id
PRIVATE_OBJECT_DIR=your_private_dir
PUBLIC_OBJECT_SEARCH_PATHS=your_search_paths

# Development
NODE_ENV=development
```

2. **Get Supabase Database URL:**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard/projects)
   - Create a new project or use existing one
   - Go to Settings → Database
   - Copy the "Connection string" under "URI"
   - Replace `[YOUR-PASSWORD]` with your actual database password

3. **Get Razorpay Keys (for payments):**
   - Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
   - Go to Settings → API Keys
   - Generate/copy your Key ID and Secret Key

## Step 4: Database Setup

```bash
# Push database schema to Supabase
npm run db:push

# If the above fails, try:
npx drizzle-kit push:pg
```

## Step 5: Fix Common Issues

### A. Cross-env Issues

If scripts fail due to cross-env, modify `package.json` scripts:

**Before:**
```json
"dev": "cross-env NODE_ENV=development tsx server/index.ts"
```

**After (for Windows):**
```json
"dev": "set NODE_ENV=development && tsx server/index.ts"
```

**After (for Mac/Linux):**
```json
"dev": "NODE_ENV=development tsx server/index.ts"
```

### B. Port Issues

If port 5000 is in use:

```bash
# Kill any process using port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F

# Mac/Linux:
lsof -ti:5000 | xargs kill -9
```

Or modify the port in `server/index.ts`:
```typescript
const PORT = process.env.PORT || 3000; // Change from 5000 to 3000
```

### C. TypeScript Issues

If you get TypeScript errors:

```bash
# Install TypeScript globally
npm install -g typescript

# Or use npx
npx tsc --noEmit
```

### D. Module Resolution Issues

If imports fail, ensure these paths exist in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["client/src/*"],
      "@assets/*": ["attached_assets/*"],
      "@shared/*": ["shared/*"]
    }
  }
}
```

## Step 6: Run the Application

```bash
# Start development server
npm run dev

# Or if cross-env issues persist:
# Windows:
set NODE_ENV=development && tsx server/index.ts

# Mac/Linux:
NODE_ENV=development tsx server/index.ts
```

## Step 7: Access the Application

1. Open browser and go to: `http://localhost:5000`
2. You should see the Rentiverse homepage
3. Register a new account or use existing credentials

## Step 8: Verify Features

Test these key features:
- ✅ User registration/login
- ✅ Product browsing and search
- ✅ Add products with image upload
- ✅ Shopping cart functionality
- ✅ Order creation and payment
- ✅ Order details view with PDF generation
- ✅ Dashboard functionality

## Common Troubleshooting

### Issue: "Cannot resolve module" errors
**Solution:** Delete `node_modules` and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Database connection errors
**Solution:** Verify your DATABASE_URL in `.env` file and ensure Supabase project is active

### Issue: Build fails
**Solution:** Check for TypeScript errors:
```bash
npx tsc --noEmit
```

### Issue: Vite dev server issues
**Solution:** Clear Vite cache:
```bash
npx vite --force
```

## Alternative Scripts (if cross-env continues to fail)

Create these scripts in `package.json`:

```json
{
  "scripts": {
    "dev:win": "set NODE_ENV=development && tsx server/index.ts",
    "dev:unix": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build",
    "db:push": "drizzle-kit push:pg",
    "db:studio": "drizzle-kit studio"
  }
}
```

Then use:
- Windows: `npm run dev:win`
- Mac/Linux: `npm run dev:unix`

## Support

If you still encounter issues:

1. Check the console for specific error messages
2. Ensure all environment variables are correctly set
3. Verify database connection
4. Try running on a different port
5. Check if all dependencies are properly installed

The application should now run successfully in Cursor AI!