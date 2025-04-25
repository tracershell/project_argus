#!/bin/bash

echo "🚀 Pulling latest changes from Git..."
git pull origin main || exit 1

echo "🔧 Building production images..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build || exit 1

echo "🧩 Restarting containers..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d || exit 1

echo "✅ Deployment complete!"


# chmod +x deploy.sh   # 한 번만 실행해서 실행 권한 부여
# ./deploy.sh          # 이후 배포할 때마다 실행