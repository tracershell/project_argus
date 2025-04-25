# PROJECT-ARGUS

> 📦 Full-stack Web App using Node.js, Express, MySQL, Redis, EJS, and Nginx  
> ⚙️ Docker Compose 기반 개발/운영 환경 지원

---

## 🧱 Stack

- Node.js + Express
- EJS Templating
- MySQL 5.7 + Redis
- Nginx (Proxy & Static)
- Docker Compose (개발 & 운영 분리)

---

## 🏗️ 프로젝트 실행 방법

### 🔧 개발 환경 실행

```bash
cp .env.example .env
make up


project-301/
├── docker-compose.yml
├── docker-compose.prod.yml
├── Dockerfile.dev
├── Dockerfile.prod
├── Makefile
├── deploy.sh
├── .env.example
├── server.js
├── views/
├── routes/
└── ...
