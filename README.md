## NestJS project

### Makefile commands

The project uses a `Makefile` to manage Redis Cluster (cache) and Redis Sentinel (pubsub/stream) stacks.

| Command                                   | Description                                                     |
| ----------------------------------------- | --------------------------------------------------------------- |
| `make setup`                              | First-time setup: bring up both stacks + initialize the cluster |
| `make up`                                 | Start both stacks                                               |
| `make down`                               | Stop both stacks, keep data                                     |
| `make destroy`                            | Stop both stacks + delete all data                              |
| `make cache-up` / `make cache-down`       | Start / stop Redis Cluster only                                 |
| `make sentinel-up` / `make sentinel-down` | Start / stop Redis Sentinel only                                |
| `make init`                               | Manually (re-)initialize the Redis Cluster                      |
| `make cluster-info`                       | Check cluster status                                            |

### Create and connect to local services

- create postgres database and mailhog service

```bash
docker compose up -d
```

- create Redis cache service (Redis cluster) and Redis stream service (Redis sentinel)

```bash
docker compose -f redis-cache.docker-compose.yaml -f redis-stream.docker-compose.yaml up -d
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
