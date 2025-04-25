# Makefile

# 개발용 실행
up:
	docker-compose up --build

upd:

	docker-compose up -d

# 운영용 실행 (배포용 이미지, 볼륨 없음)
up-prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

# 정지 및 컨테이너 삭제
down:
	docker-compose down

# 운영용 이미지 빌드만
build-prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# 실시간 로그 보기
logs:
	docker-compose logs -f

# 개발서버 접속 (node)
bash-node:
	docker exec -it project-201-node-1 bash

# DB 접속
bash-mysql:
	docker exec -it project-201-mysql-1 bash

# Redis 접속
bash-redis:
	docker exec -it project-201-redis-1 sh
