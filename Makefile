# ── Projects ──────────────────────────────────────────────────────────────────
CACHE_COMPOSE   := redis-cache.docker-compose.yaml
CACHE_PROJECT   := redis-cache

SENTINEL_COMPOSE := redis-stream.docker-compose.yaml
SENTINEL_PROJECT := redis-stream

# ── Cluster node addresses ────────────────────────────────────────────────────
MASTERS := 172.20.0.11:6379 172.20.0.12:6379 172.20.0.13:6379
REPLICAS := 172.20.0.21:6379 172.20.0.22:6379 172.20.0.23:6379

.PHONY: up down setup init cluster-info \
        cache-up cache-down cache-init cache-destroy \
        sentinel-up sentinel-down sentinel-destroy

# ══ ALL ═══════════════════════════════════════════════════════════════════════

## First-time setup: bring up both stacks then init cluster
setup: cache-up sentinel-up
	$(MAKE) init

## Start both stacks
up: cache-up sentinel-up

## Stop both stacks (keeps volumes)
down: cache-down sentinel-down

# ══ REDIS CLUSTER (cache) ═════════════════════════════════════════════════════

cache-up:
	docker compose -p $(CACHE_PROJECT) -f $(CACHE_COMPOSE) up -d

cache-down:
	docker compose -p $(CACHE_PROJECT) -f $(CACHE_COMPOSE) down

cache-destroy:
	docker compose -p $(CACHE_PROJECT) -f $(CACHE_COMPOSE) down -v
	rm -rf ./devops/redis_cluster

## Initialize the Redis Cluster (run once after first `make cache-up`)
init:
	@echo "Waiting for cluster nodes to be ready..."
	@sleep 5
	docker exec redis-master-1 redis-cli --cluster create \
	  $(MASTERS) $(REPLICAS) \
	  --cluster-replicas 1 \
	  --cluster-yes || true
	@echo "Done. Run 'make cluster-info' to verify."

## Check cluster status
cluster-info:
	docker exec redis-master-1 redis-cli cluster info
	docker exec redis-master-1 redis-cli cluster nodes

# ══ REDIS SENTINEL (pubsub / stream) ═════════════════════════════════════════

sentinel-up:
	docker compose -p $(SENTINEL_PROJECT) -f $(SENTINEL_COMPOSE) up -d

sentinel-down:
	docker compose -p $(SENTINEL_PROJECT) -f $(SENTINEL_COMPOSE) down

sentinel-destroy:
	docker compose -p $(SENTINEL_PROJECT) -f $(SENTINEL_COMPOSE) down -v
	rm -rf ./devops/redis_sentinel

# ══ NUCLEAR ═══════════════════════════════════════════════════════════════════

## Tear down both stacks AND delete all data
destroy: cache-destroy sentinel-destroy