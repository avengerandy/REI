console.log('inject script loaded');

import { User, BooksHotListRecall, EmbeddingProcessor, BetaLikelihoodReranker } from './dist/bundle.js';

const recall = new BooksHotListRecall();
const reranker = new BetaLikelihoodReranker();
const processor = new EmbeddingProcessor();
await processor.init();

let items = await processor.process(await recall.recall());

const user = new User();
user.recordClick(items[3]);
user.recordClick(items[11]);

items = await reranker.rank(user, items);
console.log(items);
