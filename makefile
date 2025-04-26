# Makefile

NODE_CONTAINER=project-argus-node-1
MYSQL_CONTAINER=project-argus-mysql
REDIS_CONTAINER=project-argus-redis-1
NGINX_CONTAINER=project-argus-nginx-1

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
	docker exec -it $(NODE_CONTAINER) bash

# DB 접속
bash-mysql:
	docker exec -it $(MYSQL_CONTAINER) bash

# NGINX 접속
bash-nginx:
	docker exec -it $(NGINX_CONTAINER) bash

# Redis 접속
bash-redis:
	docker exec -it $(REDIS_CONTAINER) sh

# 실행 중인 컨테이너 확인
ps:
	docker-compose ps

# 컨테이너 재시작
restart:
	docker-compose restart

# 전체 다시 빌드 및 실행
rebuild:
	docker-compose down
	docker-compose build
	docker-compose up -d

# 사용하지 않는 이미지/네트워크 정리
prune:
	docker system prune -f


# override 포함된 개발 모드 (기본)
dev:
	docker-compose up

devd:
	docker-compose up -d
