# Makefile

NODE_CONTAINER=project-argus-node-1
MYSQL_CONTAINER=project-argus-mysql
REDIS_CONTAINER=project-argus-redis-1
NGINX_CONTAINER=project-argus-nginx-1

# 개발 서버 실행
up:
	docker-compose up --build

up-d:
	docker-compose up -d

# 운영 서버 실행
up-prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

# 정지 및 삭제
down:
	docker-compose down

# 운영 이미지 빌드
build-prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# 실시간 로그 보기
logs:
	docker-compose logs -f

# 컨테이너 접속
bash-node:
	docker exec -it $(NODE_CONTAINER) bash

bash-mysql:
	docker exec -it $(MYSQL_CONTAINER) bash

bash-nginx:
	docker exec -it $(NGINX_CONTAINER) bash

bash-redis:
	docker exec -it $(REDIS_CONTAINER) sh

# 컨테이너 상태 보기
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
