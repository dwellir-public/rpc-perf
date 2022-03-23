# RPC Node Performance

## Introduction
Dwellir is an infrastructure provider for the decentralized web. Dwellir runs validators, collators and RPC nodes for Polkadot, Kusama and other parachains in the ecosystem. 

In Dec 2021, we received a [grant](https://kusama.polkassembly.io/treasury/125) from the Kusama Treasury to further look into RPC performance. 

During Q4 2021 and beginning of Q1 2022 there were performance issues running RPC nodes, which made it expensive to run as an operator. At the time of the grant Dwellir received, we could only serve 25 concurrent clients. 

The problems that we sat out to do was:

1. Analyze the RPC and performance segments on code level to understand the complexity of the problem.
2. Develop a suggestion as to how to improve the performance.
3. Perform benchmarks of the improved RPC code to gain better understanding of the service performance characteristics.
4. Merge the developed code with the Kusama source code repository when properly tested. As a result this will then improve the operational situation for all RPC providers.

During our initial research work a [PR was made](https://github.com/paritytech/substrate/pull/10659) in January to the Substrate repository that increased the size of the database cache from `128mb` to `1024mb`, around the same time we started to see better performance of our nodes. 

To know if the increase in database cache was the root solution to the performance increase we decided to create a RPC node performance framework that could replicate different production scenarios and measure key metrics. With key metrics it's easier to follow how performance behave. 

## Pain Points We Received From Node Operators
Here are the following feedback we received from node operators:
- The RPC service starts to degraded at ~200+ concurrent connections.
- All CPUs are not utilized efficiently when the service is under stress.
- There are complexities around deploying nodes to production.
- It's difficult to know how the system can perform at best given the specifications.
- Configure and validating deployments to make user system uses resources as efficiently as possible.


## Need For Performance Framework
We saw that there is a need for a framework to be used by node operators in the community to validate and analyze the performance of their system. 
- Provide a way for the node runner community to do performance test at a given configuration.
- Create different load simulations to measure performance.
- Being able to reproduce production issues and validate (or discard) various hypothesis.

With these needs in mind we set out to a framework, see the [repository here](addLink). 

## Tests we did
We have been doing the following tests and below we report our results. 

As a baseline for our tests we have been using the standard configurations of the node at start of this project.

Tests:
* CPU Utilization 
* Database Cache
* Peer Configuration 
* Linear Scalability

Standard configuration: 

* Database cache: 128mb
* Peers: 50 connections
* Concurrent connections: 100
* CPUs: 4

### CPU Utilization Test
..

..

### Database Cache Test
..

..
### Peer Configuration Test
..
#### Can be reduced
..
### Linear Scalability

## Conclusion

### Pain Points

### Going Forward

#### Improving The Toolkit

#### Proper Load Modeling

#### Allow For Profiling
..

..
