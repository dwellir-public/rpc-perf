# RPC-perf
## Introduction
RPC-perf is a framework to stress test an RPC node for a given system configuration. The purpose of this framework is to help node operators to know which configurations are the optimal for a given system. This framework should work for all chains developed on Substrate. This toolkit have been tested on Kusama. 

This framework let you test the following configurations:
 - Number of concurrent connections
 - Number of peers
 - Size of database cache
 - Evaluate that all cores are performing

In this repository there are 4 sample custom environments.

When a test has been completed the result can be found in the folder `tests`.

## Hardware minimum requirments and recommondations
Minimum hardware requirement: CPU with 4 cores and 8 gb memory

Recommended hardware requirements: CPU with 8 cores and 16b memory

## Installation 
This framework has been tested on Linux Ubuntu 20.04 with Python v3.8.10, Docker 20.10.13 and Docker Compose v1.29.2.

1) Install [Python3](https://www.python.org/downloads/).
2) Install [Docker Enginee](https://docs.docker.com/engine/install/).
3) Install [Docker Compose](https://docs.docker.com/compose/install/).
4) If you don't want to run Docker Compose as `sudo` you can follow this [guide](https://docs.docker.com/engine/install/linux-postinstall/).
4) Clone this RPC-perf repository.


## Running test on Kusama production node


- To run a test you need to have a Kusama relay chain in synchronization. To make the synchronize faster run the following command which will download the latest chain snapshot (~95G). Do not run this command after you have synchronized the chain as it could corrupt your chain database.

`make download-snapshot`

- Build/re-build test client when code changes or new code is pulled from repository.

`make build`

- Spin up production Kusama node and tests with.

`make test`

- To run tests with custom environment, define and pass an environment file.

`make test ENV=<path-to-env-file>`


- There are few test templates that already exists and can be invoked through `make test-<type>-<subtype>` where 
    - Available values for `type` is: `cache`, `concurrency`, `cpu` or `peers`
    - Available values for `subtype` is: `low`, `high`

- To run a test with high concurrency, you can run `make test-concurrency-high`.

- If you need to re-download the snapshot of the chain, please first run
`docker-compose down -v`
then run `make download-snapshot`.

### Default configuration
These default values can be changed in the .env-files.
- Database cache: 128mb
- CPU cores: 4
- Peers: 50
- Concurrent connections: 50

