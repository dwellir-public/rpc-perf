#!/usr/bin/make

SHELL = /bin/sh

CURRENT_UID := $(shell id -u)
CURRENT_GID := $(shell id -g)
TEST := .
export CURRENT_UID
export CURRENT_GID

build: 
	docker-compose --env-file ${TEST}/.env --profile test build

pull:
	docker-compose --env-file ${TEST}/.env pull

up: 
	docker-compose --env-file ${TEST}/.env up

test: down
	docker-compose --env-file ${TEST}/.env --profile test up --abort-on-container-exit

down: 
	-docker-compose down
	-docker rm -f substrate_node node_exporter cadvisor prometheus grafana renderer test_client	
	-docker volume rm rpc-perf_grafana_data rpc-perf_prometheus_data

download-snapshot:
	docker-compose --env-file ${TEST}/.env run prefetch-data

test-cpu-low: TEST = ./tests/cpu-test/low
test-cpu-low: test
test-cpu-high: TEST = ./tests/cpu-test/high
test-cpu-high: test

test-cache-low: TEST = ./tests/cache-test/low
test-cache-low: test
test-cache-high: TEST = ./tests/cache-test/high
test-cache-high: test

test-concurrency-low: TEST = ./tests/concurrency-test/low
test-concurrency-low: test
test-concurrency-high: TEST = ./tests/concurrency-test/high
test-concurrency-high: test

test-peers-low: TEST = ./tests/peers-test/low
test-peers-low: test
test-peers-high: TEST = ./tests/peers-test/high
test-peers-high: test
