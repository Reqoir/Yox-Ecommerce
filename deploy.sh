#!/bin/bash
set -e

echo '🚀 Starting Deployment...'
cd /var/www/yox-ecommerce

echo '📥 Pulling latest code...'
git pull origin development

echo '⚙️ Building Server...'
cd server
npm install --production=false
npm run build
pm2 reload yox-api

echo '🎨 Building Client...'
cd ../client
npm install
npm run build
pm2 reload yox-web

echo '✅ Deployment successful!'
