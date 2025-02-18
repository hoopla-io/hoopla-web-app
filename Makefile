.PHONY: build tidy run debug docker-up docker-down docker-rebuild

build:
	@mkdir -p bin
	@make tidy
	@go build -mod=vendor -o bin/main cmd/main.go

tidy:
	@go mod tidy
	@go mod vendor

run:
	@GIN_MODE=release go run cmd/main.go

debug:
	@GIN_MODE=debug go run cmd/main.go

docker-up:
	@docker compose up

docker-down:
	@docker compose down

docker-rebuild:
	@docker compose up -d --build