# RPC Node Performance

## Introduction
[Dwellir](https://dwellir.com/) is an infrastructure provider for the decentralized web. [Dwellir](https://dwellir.com/) runs validators, collators, and RPC nodes for [Polkadot](https://polkadot.network/), [Kusama](https://kusama.network/), and other parachains in the ecosystem. 

In Dec 2021, we received a [grant](https://kusama.polkassembly.io/treasury/125) from the [Kusama](https://kusama.network/) Treasury to further look into RPC performance. 

During Q4 2021 and in the beginning of Q1 2022 we faced severe performance issues running RPC nodes, which made it expensive to run as an operator. 

This report presents the work that we, at [Dwellir](https://dwellir.com/), performed to mitigate these performance issues and links to the grant deliverables.

## Understanding the complexity of the problem
Initially, we started capturing feedback from multiple community members (see special thanks bellow), including [Parity](https://www.parity.io/), other node operators, software development specialists, and software profiling specialists to gain a better understanding of the nature of the problem and the way to mitigate it.

Software and Profiling specialists quickly pointed to the need to follow a structured approach to resolving performance issues and adopting industry best practices in doing so. 

To start with we consolidated a list of "pain points" with the the node operators, in order to have a targets to work towards, or key issues to investigate and ultimately resolve.

The perceived issues by node operators would fall in one of the two following categories:

- Non-lineal scalability of the service, often with an identified max number of concurrent connections, which would vary between operators, but generally would be considered  too low.
- Perception of non-utilization of available hardware resources (CPU cores).

We also received feedback from members of the community regarding node deployment settings that could impact its performance:

- database cache settings.
- libp2p number of peer connections.

Software and Profiling specialists would also point at the following issues inherent of software performance work:

- Difficulty to tune/work on performance when there isn't a clear specification of what is achievable or considered good or bad  for a given reference hardware platform.
- Complexity to operate production infrastructure which typically involves orchestration functionality that will manage (i.e. limit) resource availability across workloads. This typically translates into the need to make "lab" tests that isolate workload from delivery platforms.

Therefore it would be ideal to have a structured approach to performance testing that provide us with the capability to validate a deployment: i.e. perfors within its specification or expected performance.


## How to improve performance: Need for a Performance testing toolkit
After gaining a better understanding of the complexity of our problem we decided to build a minimum viable performance testing toolkit with the following requirements:

* Easy to use. Must be easy to deploy on any environment including a lab or a development laptop, with no particular setup process.
* Must run well-specified test scenarios.
* Must run well-specified test workloads.
* Must capture related metrics. 
* All tests scenarios / workload specifications and resulting metrics must be automatically collected and easy to archive in git or a similar repository.
* The testing process must be unattended, as much as possible.
* Ideally it should be usable during all relevant lifecycle phases, from profiling to validating the peformance of a production platform.

And must allow us to test, initially, the paint-points collected from the community.

Our initial minimum viable performance testing toolkit is available in the following [git repository]() and has the following characteristics:

* Based on Docker Compose.
* Can be used with any [Substrate](https://docs.substrate.io/) Node ([Kusama](https://kusama.network/), [Polkadot](https://polkadot.network/), [Development](https://docs.substrate.io/), etc)
* Data collection is based on [cAdvisor](https://github.com/google/cadvisor)/[Prometheus](https://prometheus.io/) and can be supervised live with [Grafana](https://grafana.com/). 
* Deployment and tool configuration is automatic.
* Will create the node, download its initial data, wait for sync, run the test workload and collect metrics and charts automatically.
* Tests scenarios are configured in simple environment files, easy to store in a git repository.
* An initial test workload model is provided as a nodejs process.

The performance toolkit is prototypal yet allowed us to identify, mitigate and/or resolve the performance issues identified initially:

## Performed Tests
The main metric that we collected to assess how the RPC node performed is accumulated CPU time (user + system) divided by the total number of requests served during the test. All tests will run a standardized workload. 

For example, we can say that a given test configuration spent 6ms of CPU time per request, while another spent 8ms per request. This allows us to get an idea of the relative performance of different node setups, node versions, underlying platform configurations, etc.

### CPU Core Utilization Test

Node operators collected telemetry on a load balanced deployment on metal that clearly showed one CPU core overloaded while the others remained healthy. Since the metal was dedicated to the RPC node deployment the node operator started to work on the hypothesis that the RPC node would not utilize cores in a balanced way.

We designed `cpu-tests` to look specifically at core utilization with the goal to provide the node operator with clarity about the way in which the RPC node behaves. 

A batch of tests was performed with **8 cores** active and another with **2 cores** active.  The first set served the standardized workload investing **8ms** of CPU time per request and the second investing **7ms** of CPU time per request. 

Furthermore, the charts of CPU activity captured during the execution confirmed that the CPU core usage is balanced.

![panel-2](https://user-images.githubusercontent.com/412837/160618508-6fd73d32-0fdb-451a-8458-4ee62c3fc6f8.png)

The test confirms that the RPC Node uses all cores in a balanced way and that the penalty of having more cores active does not seem significant. 

### Database Cache Test
We designed the  `cache-test` to measure the potential impact of database cache adjustments in production.

Since our standardized workload is not too rich (see next steps below) we decided to not only increase the default cache size but also reduce the default cache to test the behavior of the node under different cache settings. We tested with **32Mb** versus **1024Mb**. 

With **1024Mb** of database cache the standarized workload was served investing **5ms** of CPU time with request, while with **32Mb** CPU time per request was **26ms**.

The result confirms that Database cache setting has a significant impact on node performance.
### Peer Configuration Test
We designed **peers-test** to check the impact of the `number of peers` setting of the **libp2p** protocol on general node performance. 

We tested values of **50** p2p peers versus **4** p2p peers. 

With 50 peers the standardized workload was served investing **6ms** of CPU time per request while with 4 p2p peers the required CPU time came down to **4ms**. 

The test results confirm some gain in performance.

### Linear Scalability

In line with the feedback received by operators, we designed a **concurrency-test** to be able to test for scalability.

By increasing the number of simulated users or concurrent connections there may be a point in which the overhead becomes too expensive and the same workload is served with a much higher CPU investment per request. So, we expect to see a point in which the node "degrades" and provides a sub suboptimal service. 

We started simulating 50 concurrent users/connections and increased the number in different test runs until 400 concurrent users. In all cases, the standardized workload was split among the available user connections.

We can clearly see how CPU time invested per request grows as concurrent users grow. Some test runs with 400 concurrent users saw an investment on CPU per request 250% higher than with lower concurrency, which supports the claim that scalability is not lineal.

However, we see that our test runs fall into 2 different groups. There are "good runs" that seems to scale linearly, but some other runs are way worse, see the chart below:

![ConcurrencyTestChart](https://user-images.githubusercontent.com/412837/160618425-b3dc3445-a623-4d83-b27c-ac654b1a20f6.png)

We find it very strange that **100K** requests by 400 simulated users could be served in **8.5ms** per request while a different run is executed with **20.3ms** per request, in the  second run requests are **240%** more expensive to serve. 

We don't want to draw any conclusion at this stage from this test without first implementing a better workload model (see next steps below). 

## Conclusion

Although the toolkit is prototypal it was effective in gaining an understanding of what we were experiencing in the data-center.

[Dwellir](https://dwellir.com/)'s initial performance issues have been seriously mitigated by a structured and reproducible testing approach. We could measure each identified point, the effect of tunning performance parameters. In the case of CPU Core utilization, we could identify that the cause of the issue was not related to the RPC node. 

The higher Database cache setting was a big performance increase. In fact, now it is the default setting on new node software releases. We found that the lower p2p connections had a great impact in load balanced deployments, as the resulting number of connections is multiplied by the number of load balanced nodes. 

The linear scalability test is inconclusive for us at this stage, our workload modeling is too simplistic to draw a conclusion. We would like to re-test with a better workload model and a profiling interface. It is very encouraging to see that some runs were found to scale linearly to 400 concurrent connections. It would be nice to find an explanation for the executions that came back with way worse metrics.

We believe there is significant potential in continuing the development of this performance toolkit. After our experience we consider that the following next steps would be appropriate:

### Next Steps

We recommend extending the performance toolkit with:

#### Test Plans

Some of the tests involved simulating workloads under different node setups. For example cache size, peer connections, etc. It would be desirable to be able to create a plan that would involve running N tests in which parameters are been gradually changed. This would be useful to establish relationships between parameters in an automated manner.

For example: Test a workload model on 50 deployments with DB cache from 128MB to 10GB. Collecting the CPU time invested per simulated request under all scenarios.

Test plans should also aggregate the collection of metrics of all the runs so that they can be charted. 

Execution should be automatic.

#### Improved Workload Modeling

Our current workload model is a minimum viable product that simply requests blockchain blocks. Ideally, it should be possible to generate workloads that match those in production. I.e. they have approximate blends of requests, observe things such as wait times, randomization, ramp ups, ramp downs, peaks, etc.

Several well-known open-source performance testing tools that simulate client workload exists. Their viability to perform this task has been initially assessed. Most products provide a simple http or websocket request interface. However, we believe that part of the complexity of substrate deployments lies in the richness of its API and the power of its client libraries.

We looked at toolkits that would allow us to use a custom client library in nodejs to provide the implementation instead of just plain HTTP/WS definitions. 

It seems like [artillery.io](https://www.artillery.io/) has the best chance to allow us to implement rich workload modeling.

#### Load balancing test scenarios

Currently, a single RPC node instance is tested, however, it would be desirable to test also deployments in which there is a load balancer in place and a configurable number of nodes serving the requests.

#### Profiling interface

To best serve the community, the toolkit should also be useful during development and profiling. For example by using the load simulation while interacting with the profiler or by running a test plan in which memory dumps are collected for later analysis, etc.

#### Integration with existing tools

There may be other community tools worth integrating into the performance toolkit. In an initial search, we came across [polkadot-launch](https://github.com/paritytech/polkadot-launch) by Parity, which is meant to run Polkadot test networks with include both relay chain and parachains. 

It would be valuable to be able to test more complex substrate test networks with this performance toolkit.

This could be achieved by exiting the toolkit to run [polkadot-launch](https://github.com/paritytech/polkadot-launch) and an array of client workloads each meant for each participating node. 

## Special Thanks

The following community members have provided their input at some point during the execution of this project: [Parity](https://www.parity.io/), [OnFinality](https://www.onfinality.io/), [Paranodes.io](https://www.paranodes.io/), [Valletech](https://valletech.eu/) 
