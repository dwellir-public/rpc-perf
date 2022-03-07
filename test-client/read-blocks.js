// Required imports
import { ApiPromise, WsProvider } from '@polkadot/api';
import * as log from 'fancylog'
import { performance } from 'perf_hooks';


const address = process.env.WS_ADDRESS || 'ws://127.0.0.1:9996';
// const address = process.env.WS_ADDRESS || 'wss://kusama-rpc.polkadot.io';
const START_BLOCK = process.env.START_BLOCK || 0;
const END_BLOCK = process.env.END_BLOCK || 1000;

export async function traverseBlocks(address, start, end, tag="X") {
    // log.info(`${tag}::Traversing blocks from ${start} till ${end}`);
    const provider = new WsProvider(address);
    const api = await ApiPromise.create({ provider: provider });
    const length = end-start;

    let pgLength = Math.round((end - start) / 10);
    let pg = 0;
    let pgCount = 0;
    let block = start;

    var startTime = performance.now()
    
    log.verbose(`${tag}::Progress.... ${pg * 10}%`);
    while (block < end) {
        const randomBlock = Math.floor(Math.random() * length) + start;
        const blockHash = await api.rpc.chain.getBlockHash(randomBlock);
        const rpcBlock = await api.rpc.chain.getBlock(blockHash);
        const apiAt = await api.at(blockHash);
        await apiAt.query.system.events();
        await apiAt.query.transactionStorage?.blockTransactions();
        let extrinsicSize = await apiAt.query.system.allExtrinsicsLen();
        // log.info(`Extrinsic size of block ${randomBlock} is ${extrinsicSize} bytes`);
        
        // await api.query.session.validators();

        block += 1;

        pgCount += 1;
        if (pgCount == pgLength) {
            pgCount = 0;
            pg++;
            log.verbose(`${tag}::Progress.... ${pg * 10}%`);
            // log.verbose(`Current block ${block}`);
        }
    }

    var endTime = performance.now()
    log.info(`Traversing ${end - start} block took ${(endTime - startTime)/1000} seconds on connection ${tag}`)
}

// Execute script
async function main() {
    // Create our API with a default connection to the local node
    let start = Number.parseInt(START_BLOCK, 10);
    let end = Number.parseInt(END_BLOCK, 10);
    await traverseBlocks(address, start, end);
}

// main().catch(console.error).finally(() => process.exit());
