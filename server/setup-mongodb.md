# MongoDB Setup Guide

## Option 1: MongoDB Atlas (Cloud) - RECOMMENDED

### Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/atlas
2. Click "Try Free"
3. Sign up with your email
4. Choose "Free" tier (M0 Sandbox)

### Step 2: Create Cluster
1. Choose "AWS" as provider
2. Select region closest to you (e.g., Mumbai for India)
3. Click "Create Cluster"
4. Wait 3-5 minutes for cluster to be ready

### Step 3: Create Database User
1. Go to "Database Access" in left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create username: `msme-dpr-user`
5. Create password: `msme-dpr-2024` (or your choice)
6. Click "Add User"

### Step 4: Whitelist IP Address
1. Go to "Network Access" in left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### Step 5: Get Connection String
1. Go to "Clusters" in left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" and version "4.1 or later"
5. Copy the connection string

### Step 6: Update .env File
Replace the connection string in your `.env` file:

```env
MONGODB_URI=mongodb+srv://msme-dpr-user:msme-dpr-2024@cluster0.xxxxx.mongodb.net/msme-dpr?retryWrites=true&w=majority
```

Replace `xxxxx` with your actual cluster identifier.

## Option 2: Local MongoDB Installation

### Windows
1. Download from: https://www.mongodb.com/try/download/community
2. Run installer
3. Start MongoDB service
4. Use: `MONGODB_URI=mongodb://localhost:27017/msme-dpr`

### macOS
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

### Linux
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

## Option 3: Docker (Quick)
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## Test Connection
After setting up, run:
```bash
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server is running on port 5000
```
