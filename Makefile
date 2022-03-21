#!/usr/bin/make

SHELL = /bin/sh

CURRENT_UID := $(shell id -u)
CURRENT_GID := $(shell id -g)
TEST_ENV := .env.default
export CURRENT_UID
export CURRENT_GID

build: 
	docker-compose --profile test build

pull:
	docker-compose pull

up: 
	docker-compose up

test: 
	docker-compose --profile test up --abort-on-container-exit

download-snapshot:
	docker-compose run prefetch-data