# RPC Node Performance

## Introduction
[Dwellir](https://dwellir.com/) is an infrastructure provider for the decentralized web. [Dwellir](https://dwellir.com/) runs validators, collators, and RPC nodes for [Polkadot](https://polkadot.network/), [Kusama](https://kusama.network/), and other parachains in the ecosystem. 

In Dec 2021, we received a [grant](https://kusama.polkassembly.io/treasury/125) from the [Kusama](https://kusama.network/) Treasury to further look into RPC performance. 

During Q4 2021 and the beginning of Q1 2022 we faced severe performance issues running RPC nodes, which made it expensive to run as an operator. 

This report presents the work we, at [Dwellir](https://dwellir.com/), performed to mitigate these performance issues and links to the grant deliverables.

## Understanding the complexity of the problem
Initially, we started capturing feedback from multiple community members (see special thanks bellow), including [Parity](https://www.parity.io/), other node operators, software development specialists, and software profiling specialists to gain a better understanding of the nature of the problem and the way to mitigate it.

Software and Profiling specialists quickly pointed at the need to follow and structured approach to resolving performance issues and adopting industry best practices in doing so. 

To start with we decided to consolidate a list of "pain points" with the rest of the node operators, in order to have a target to work towards, or key issues to investigate and ultimately resolve.

The perceived issues by node operators would fall in one of the 2 following categories:

- Non-lineal scalability of the service, often with an identified max number of concurrent connections, which would vary between operators, but generally would be considered  too low.
- Perception of non-utilization of available hardware resources (CPU cores).

We also received feedback from members of the community regarding node settings that could impact the performance of the deployments:

- database cache settings.
- libp2p number of peer connections.

Additionally Software and Profiling specialists would point at the following issues inherent of software performance work:

- Difficulty to tune/work on performance when there isn't a clear specification of what is achievable or considered good or bad  for a given reference hardware platform.
- Complexity to operate production infrastructure which typically involves orchestration functionality that will manage (i.e. limit) resource availability across workloads. This typically translates into having the ability to make "lab" tests and isolate workload from delivery platforms.

Therefore it would be ideal to have a structured approach to performance testing that provided us with the capability to validate a deployment: i.e. performs within its specification or expected performance.


## How to improve performance: Need for a Performance testing toolkit
After gaining a better understanding of the complexity of our problem we decided to build a minimum viable performance testing toolkit with the following requirements:

* Easy to use. Must be easy to deploy on any environment including lab or development laptop, with no particular setup steps.
* Must run well-specified test scenarios.
* Must run well-specified test workloads.
* Must capture related metrics. 
* All tests scenarios / workload specifications and resulting metrics must be automatically collected and easy to archive in git or a similar repository.
* The testing process must be unattended, as much as possible.
* Ideally should be usable during all relevant lifecycle phases, from profiling to validating the peformance of a production platform.

And must allow us to test, initially, the paint-points collected from the community.

Our initial minimum viable performance testing toolkit is available in the following [git repository]() and has the following characteristics:

* Based on Docker Compose.
* Can be used with any [Substrate](https://docs.substrate.io/) Node ([Kusama](https://kusama.network/), [Polkadot](https://polkadot.network/), [Development](https://docs.substrate.io/), etc)
* Data collection is based on [cAdvisor](https://github.com/google/cadvisor)/[Prometheus](https://prometheus.io/) and can be supervised live with [Grafana](https://grafana.com/). 
* Deployment and tool configuration is automatic.
* Will create the node, download its initial data, wait for sync, run the test workload and collect metrics and charts automatically.
* Tests scenarios are configured in simple environment files easy to store in a git repository.
* An initial test workload model is provided as a nodejs process.

The performance toolkit is prototypal yet allowed us to identify, mitigate and/or resolve the performance issues identified initially:

## Performed Tests
We have been doing the following tests and below we report our results. 

As a baseline for our tests, we have been using the standard configurations of the node at the start of this project.

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

Although the toolkit is prototypal it was effective in gaining an understanding of what we were experiencing in the data-center.

[Dwellir](https://dwellir.com/)'s initial performance issues have been seriously mitigated by a structured and reproducible testing approach. We could measure each identified point, the effect of tunning performance parameters, and in the case of CPU utilization, we could identify that the root cause of the issue was in the XXXXXXXXX. 

We believe there is significant potential in continuing the development of this performance toolkit. After our experience we consider that the following next steps would be appropriate:

### Next Steps

We recommend extending the performance toolkit with:

#### Test Plans

Some of the tests involved simulating workloads under different node setups. For example cache size, peer connections, etc. It would be desirable to be able to create a plan that would involve running N tests in which parameters are been gradually changed. This would be useful to establish relationships between parameters in an automated manner.

For example: Test a workload model on 50 deployments with DB cache from 128MB to 10GB. Collecting the CPU time invested per simulated request under all scenarios.

Test plans should also aggregate the collection of metrics of all the runs so that they can be charted. 

Execution should be automatic.

#### Improved Workload Modeling

The workload model is a minimum viable product that will simply request blockchain blocks. Ideally, it should be possible to generate workloads that match those in production. I.e. they have approximate blends of requests, observe things such as wait times, randomization, ramp ups, ramp downs, peaks, etc.

Several well-known opensource performance testing tools that simulate client workload exist and its viability to perform this task has been initially assessed. Most products provide a simple http or websocket request interface. However, we believe that part of the complexity of substrate deployments lies in the richness of its API and power of its client libraries.

So we looked at toolkits that would allow us to use a custom client library in nodejs to provide the implementation instead of just plain HTTP/WS definitions. 

It seems like [artillery.io](https://www.artillery.io/) has the best chances to allow us to implement rich workload modeling.

#### Load balancing test scenarios

Currently, a single rpc node instance is tested, however it would be desirable to test also deployments in which there is a load balancer in place and a configurable number of nodes serving the requests.

#### Profiling interface

To best serve the community. The toolkit should also be useful during development and profiling. For example by using the load simulation while iterating with the profiler, or by running a test plan in which memory dumps are collected for later analysis, etc.

#### Integration with existing tools

There may be other community tools worth integrating into the performance toolkit. In an initial search, we came across [polkadot-launch](https://github.com/paritytech/polkadot-launch) by Parity, which is meant to run polkadot test networks with include both relay change and parachains. 

It would be nice to be able to test more complex substrate test networks with this performance toolkit.

This could be achieved by exiting the toolkit to run [polkadot-launch](https://github.com/paritytech/polkadot-launch) and an array of client workloads each meant for each participating node. 

## Special Thanks

The following community members have provided their input at some point during the execution of this project: [Parity](https://www.parity.io/), [OnFinality](https://www.onfinality.io/), [Paranodes.io](https://www.paranodes.io/), [Valletech](https://valletech.eu/) 
