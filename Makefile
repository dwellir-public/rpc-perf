#!/usr/bin/make

SHELL = /bin/sh

CURRENT_UID := $(shell id -u)
CURRENT_GID := $(shell id -g)
ENV := ./.env
export CURRENT_UID
export CURRENT_GID

build: 
	docker-compose --env-file ${ENV} --profile test build

pull:
	docker-compose --env-file ${ENV} pull

up: 
	docker-compose --env-file ${ENV} up

test: down
	docker-compose --env-file ${ENV} --profile test up --abort-on-container-exit

down: 
	-docker-compose down
	-docker rm -f substrate_node node_exporter cadvisor prometheus grafana renderer test_client	
	-docker volume rm rpc-perf_grafana_data rpc-perf_prometheus_data

download-snapshot:
	docker-compose --env-file ${ENV} run prefetch-data

test-cpu-low: ENV = ./tests/cpu-test/low/.env
test-cpu-low: test
test-cpu-high: ENV = ./tests/cpu-test/high/.env
test-cpu-high: test

test-cache-low: ENV = ./tests/cache-test/low/.env
test-cache-low: test
test-cache-high: ENV = ./tests/cache-test/high/.env
test-cache-high: test

test-concurrency-low: ENV = ./tests/concurrency-test/low/.env
test-concurrency-low: test
test-concurrency-high: ENV = ./tests/concurrency-test/high/.env
test-concurrency-high: test

test-peers-low: ENV = ./tests/peers-test/low/.env
test-peers-low: test
test-peers-high: ENV = ./tests/peers-test/high/.env
test-peers-high: test
