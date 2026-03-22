## Nestjs project

### Create and connect to local database

- create postgres database

```bash
docker compose up -d
```

### Run scripts

```bash
ts-node -r tsconfig-paths/register src/scripts/template.script.ts
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
