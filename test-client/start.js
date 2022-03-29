// Required imports
import { ApiPromise, WsProvider } from '@polkadot/api';
import * as log from 'fancylog';
import fetch from "node-fetch";
import * as fs from 'fs';
import axios from 'axios';
import unirest from 'unirest';


const ADDRESS = process.env.WS_ADDRESS || 'ws://127.0.0.1:9944';
const MAX_CONNECTIONS = process.env.CONCURRENT_CONNECTIONS_MAX || 100;
const WAIT_TIME = process.env.CONCURRENT_CONNECTIONS_WAIT_TIME_IN_SEC || 1;
const TOTAL_REQ = process.env.TOTAL_REQUESTS || 1000;
const TOTAL_BLOCKS = 256;
const TEST_DIR = process.env.TEST_DIR || 'default';
const NODE_MEM = process.env.NODE_MEM;
const NODE_CPU_SET = process.env.NODE_CPU_SET;
const NODE_DB_CACHE = process.env.NODE_DB_CACHE;
const NODE_IN_PEERS = process.env.NODE_IN_PEERS;
const NODE_OUT_PEERS = process.env.NODE_OUT_PEERS;

const QUERY = {
  CPU_USAGE: "sum(container_cpu_usage_seconds_total{name=\"substrate_node\"})",
  CPU_USAGE_PER_CPU: "container_cpu_usage_seconds_total{name=\"substrate_node\"}",

}

// Execute script
async function main() {
  const provider = new WsProvider(ADDRESS);
  const api = await ApiPromise.create({ provider: provider });

  // wait for chain to sync
  await chainSync(api);

  let currentBlock = await api.rpc.chain.getBlock();
  const endBlock = currentBlock.block.header.number;
  const startBlock = endBlock - TOTAL_BLOCKS;

  let startDate = new Date();
  let waitTime = Number.parseInt(WAIT_TIME, 10);
  let maxConnections = Number.parseInt(MAX_CONNECTIONS, 10);
  let totalRequests = Number.parseInt(TOTAL_REQ, 10);
  let requestsServed = 0;
  let requestsPerConn = Math.ceil(totalRequests / maxConnections);

  let info = {
    counter: 0,
    connections: 0,
    total: totalRequests,
    startDate: startDate
  }

  log.info(`Test will make ${requestsPerConn} requests per user`);
  progress(info);

  // initialize users
  let users = [];
  for (let i = 0; i < maxConnections; i++) {
    const provider = new WsProvider(ADDRESS);
    users.push(await ApiPromise.create({ provider: provider }));
  }

  // simulate users until all the requests are served
  while (requestsServed < totalRequests) {
    let connToAdd = rampUpConnectionCount(info.connections, maxConnections);
    // make more users active
    for (let i = 0; i < connToAdd; i++) {
      let requestsToServe = Math.min(requestsPerConn, totalRequests - requestsServed);
      traverseBlocks(users[info.connections], startBlock, endBlock, requestsToServe, info).catch(error => log.error(error));
      info.connections++;
      requestsServed += requestsToServe;
    }

    // wait before ramping up the users
    await sleep(waitTime);
  }

}

// show progress twice every minute
async function progress(info) {
  while (info.counter < info.total) {
    let progress = Math.floor(info.counter * 100 / info.total);
    log.info(`Progress: ${info.counter}/${info.total} blocks, ${progress}% with ${info.connections} concurrent connections`);
    await sleep(30);
  }

  // when all requests are fulfilled, record and save the results
  recordResults(info.startDate, new Date());
}

function rampUpConnectionCount(currentConnections, maxConnections) {
  // start with 10% of connections
  if (currentConnections == 0) {
    return Math.max(5, Math.floor(maxConnections / 10));
  }

  // double the connections every time
  let newConnectionsToAdd = currentConnections;

  return Math.min(newConnectionsToAdd, maxConnections - currentConnections);
}

async function chainSync(api) {
  // wait sometime before starting the tests
  sleep(15);
  let syncState = await api.rpc.system.syncState();
  let highestBlock = syncState.highestBlock;
  let currentBlock = syncState.currentBlock;
  log.info(`Highest Block= ${highestBlock} and Current Block = ${currentBlock}`);

  while (highestBlock - currentBlock > 3) {
    log.info(`Waiting for chain to complete syncing. ${highestBlock - currentBlock} to go!`);
    await sleep(3);
    syncState = await api.rpc.system.syncState();
    currentBlock = syncState.currentBlock;
  }

  log.info(`Chain is now in sync!`);

}

async function sleep(seconds) {
  await new Promise(r => setTimeout(r, seconds * 1000));
}

async function dumpMetrics(url, filename) {
  // download prometheus metrics in a file
  return new Promise((resolve, reject) => {
    fetch(url)
      .then(response => response.text())
      .then(data => {
        writeFile(data, filename);
        resolve()
      });
  })
}

async function recordResults(startDate, endDate) {
  let currentRun = TEST_DIR + "/" + startDate.getTime();
  let dir = `./etc/tests/${currentRun}`
  fs.mkdirSync(dir, { recursive: true })

  // download prometheus metrics
  await dumpMetrics('http://cadvisor:8080/metrics', `${dir}/metrics-cadvisor.txt`);
  await dumpMetrics('http://node_exporter:9100/metrics', `${dir}/metrics-node-exporter.txt`);
  await dumpMetrics('http://substrate_node:9615/metrics', `${dir}/metrics-polkadot.txt`);
  
  // download panels from grafana
  let panels = 8;
  for (let i = 1; i <= panels; i++) {
    await downloadImage(`http://admin:admin@grafana:3000/render/d-solo/pMEd7m0Mz/cadvisor-exporter?orgId=1&from=${startDate.getTime()}&to=${endDate.getTime}&panelId=${i}&width=1000&height=500`, `${dir}/panel-${i}.png`);
  }

  // calculate key metrics
  let sumCpuUsage = await getMetricRange(QUERY.CPU_USAGE, startDate.getTime(), endDate.getTime());
  let cpuUsage = await getMetricRange(QUERY.CPU_USAGE_PER_CPU, startDate.getTime(), endDate.getTime());
  let totalRequests = Number.parseInt(TOTAL_REQ, 10);
  let cpuTimePerRequest = (sumCpuUsage * 1000) / totalRequests;

  let stats = {
    start: startDate,
    end: endDate,
    result: {
      CpuUsageSum: sumCpuUsage,
      cpuUsage: cpuUsage,
      cpuTimePerRequest: `${cpuTimePerRequest} ms`
    },
    type: TEST_DIR,
    config: {
      concurrency: Number.parseInt(MAX_CONNECTIONS, 10),
      totalRequests: Number.parseInt(TOTAL_REQ, 10),
      nodeMemory: NODE_MEM,
      nodeCpuSet: NODE_CPU_SET,
      nodeDBCache: NODE_DB_CACHE,
      nodePeersIn: Number.parseInt(NODE_IN_PEERS, 10),
      nodePeersOut: Number.parseInt(NODE_OUT_PEERS, 10)
    }
  };

  writeFile(JSON.stringify(stats), `${dir}/key-metrics.json`);
  log.info(`Results recorded at ${currentRun}`);
  log.info(`CPU Usage sec ${sumCpuUsage} from start: ${startDate.getTime() / 1000} and end: ${endDate.getTime() / 1000}`);

  // exit after recording results
  process.exit();
}

function writeFile(content, filepath) {
  try {
    fs.writeFileSync(filepath, content);
    //file written successfully
  } catch (err) {
    log.error(err)
  }
}

// downloading image at a url
async function downloadImage(url, filepath) {
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });
  return new Promise((resolve, reject) => {
    response.data.pipe(fs.createWriteStream(filepath))
      .on('error', reject)
      .once('close', () => resolve(filepath));
  });
}

 // fetch prometheus metric by name
function getMetric(metricName, time) {
  return new Promise((resolve, reject) => {
    unirest("POST", "http://prometheus:9090/api/v1/query")
      .headers({
        "content-type": "application/x-www-form-urlencoded"
      })
      .form({
        "query": metricName,
        "time": time / 1000
      }).end((res) => {
        if (res.error) reject;
        else {
          let result = res.body.data.result;
          if (result.length > 0) {
            resolve(result.map(r => r.value[1]));
          }
          else {
            resolve([]);
          }
        }
      })

  })
}

async function getMetricRange(metricName, startTime, endTime) {
  let start = await getMetric(metricName, startTime);
  if (start.length > 0) {
    log.warn(`Expected no metric at start of the test but found start value ${start}.`)
  }

  return await getMetric(metricName, endTime);
}

// traverse random blocks in the range of start and end
async function traverseBlocks(api, start, end, totalCount, info) {
  const length = end - start;
  let count = 0;
  while (count < totalCount) {
      const randomBlock = Math.floor(Math.random() * length) + start;
      const blockHash = await api.rpc.chain.getBlockHash(randomBlock);
      await api.rpc.chain.getBlock(blockHash);
      const apiAt = await api.at(blockHash);
      await apiAt.query.system.events();
      await apiAt.query.transactionStorage?.blockTransactions();
      await apiAt.query.system.allExtrinsicsLen();
      count++;
      info.counter++;
  }
}

main().catch(console.error);
