# RPC Node Perf

## Introduction
Dwellir is an infrastructure provider for the decentralized web. Dwellir runs validators, collators and RPC nodes for Polkadot, Kusama and other parachains in the ecosystem. 

In August 2021 we received a grant from the Kusama Treasury to build and further develop a RPC node infrastructure for Kusama. We have since then implemented the service, but we have discovered significant performance issues with the RPC code itself. These issues had prevented us from fully delivering the RPC service to the community in a good way. 

In Dec 2021, we received a grant from the Kusama Treasury to further look into RPC performance. As a first step to tackle this problem, we wanted to create a framework that could replicate different production scenarios and measure key metrics.


## Pain Points
- The service starts degrading at ~200+ concurrent connections.
- All cpus are not utilized efficiently when service is under stress.
- Complexity of deploying nodes to production.
- Understanding what is achievable for a given system specs.
- Configuring and validating deployments to use resources as efficiently as possible.


## Need for Performance Tooling
- Provide a way for node runner community to performance test a given configuration
- Measuring performance under different load simulation
- Reproduce production issues and validate/discard various hypothesis

## Tests we did
..

### Cpu utilization test
..

..

### DB Cache test
..

..
### Peer configuration test
..

..


## Conclusion
..

..