export async function traverseBlocks(api, start, end, totalCount, info) {
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
