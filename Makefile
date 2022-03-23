#!/usr/bin/make

SHELL = /bin/sh

CURRENT_UID := $(shell id -u)
CURRENT_GID := $(shell id -g)
TEST := .
export CURRENT_UID
export CURRENT_GID

build: 
	docker-compose --env-file ${TEST/.env} --profile test build

pull:
	docker-compose --env-file ${TEST/.env} pull

up: 
	docker-compose --env-file ${TEST/.env} up

test: 
	docker-compose --env-file ${TEST/.env} --profile test up --abort-on-container-exit

download-snapshot:
	docker-compose --env-file ${TEST/.env} run prefetch-data