## Nestjs project

### Create and connect to local services

- create postgres database and mailhog service

```bash
docker compose up -d
```

- create redis cache service (redis cluster)

```bash
docker compose -f redis-cache.docker-compose.yaml up -d
```

- create redis stream service (redis sentinel)

```bash
docker compose -f redis-stream.docker-compose.yaml up -d
```

### Run scripts

```bash
ts-node -r tsconfig-paths/register src/scripts/template.script.ts
```

or

```bash
yarn script
```

- Want to create access token

```bash
yarn script src/scripts/access-token.ts --userId 1
```

- Want to test socket

```bash
yarn script src/scripts/socket-test.ts --url http://localhost:3002 \
  --token "your-jwt-token" \
  --conversationId 123 \
  --message "Hello World"
```

### Mailer docker service

```bash
http://localhost:8025/
```

### Swagger

```bash
http://localhost:{port}/api
```

### Reference

- https://typeorm.io/docs/migrations/why
