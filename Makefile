IMAGE_NAME  := piramyd-mcp
IMAGE_TAG   := latest
FULL_IMAGE  := $(IMAGE_NAME):$(IMAGE_TAG)
PORT        ?= 3000

.DEFAULT_GOAL := help
.PHONY: help build run up down logs

help: ## Show available commands
	@echo ""
	@echo "  Piramyd MCP — Docker Makefile"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*##/ { printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo ""

build: ## Build Docker image (piramyd-mcp:latest)
	docker build --target production -t $(FULL_IMAGE) .

run: ## Run container (export PIRAMYD_API_KEY=your-key first)
	@echo ""
	@echo "  MCP endpoint : http://localhost:$(PORT)/mcp"
	@echo "  Health check : http://localhost:$(PORT)/health"
	@echo ""
	@echo "  Claude Code config:"
	@echo "  claude mcp add --transport http piramyd http://localhost:$(PORT)/mcp"
	@echo ""
	docker run --rm \
	  -e PIRAMYD_API_KEY=$(PIRAMYD_API_KEY) \
	  -e PIRAMYD_JWT_TOKEN=$(PIRAMYD_JWT_TOKEN) \
	  -e PIRAMYD_API_BASE_URL=$(PIRAMYD_API_BASE_URL) \
	  -e PORT=$(PORT) \
	  -p $(PORT):$(PORT) \
	  $(FULL_IMAGE)

up: ## Start with docker compose (reads .env automatically)
	docker compose up -d

down: ## Stop docker compose containers
	docker compose down

logs: ## Tail docker compose logs
	docker compose logs -f
