#!/usr/bin/make

SHELL = /bin/sh

CURRENT_UID := $(shell id -u)
CURRENT_GID := $(shell id -g)
TEST_ENV := .env
export CURRENT_UID
export CURRENT_GID

build: 
	docker-compose --env-file ${TEST_ENV} --profile test build

pull:
	docker-compose --env-file ${TEST_ENV} pull

up: 
	docker-compose --env-file ${TEST_ENV} up

test: 
	docker-compose --env-file ${TEST_ENV} --profile test up --abort-on-container-exit

download-snapshot:
	docker-compose --env-file ${TEST_ENV} run prefetch-data