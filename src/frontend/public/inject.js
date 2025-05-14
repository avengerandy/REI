console.log('inject script loaded');

import { Item, User, BooksHotListRecall, EmbeddingProcessor, BetaLikelihoodReranker } from './dist/bundle.js';

const user = new User();
const recall = new BooksHotListRecall();
const reranker = new BetaLikelihoodReranker();
const processor = new EmbeddingProcessor();
await processor.init();
let items = await processor.process(await recall.recall());
let itemMap = new Map();
for (let i = 0; i < items.length; i++) {
    itemMap.set(items[i].getHash(), items[i]);
}

document.addEventListener('mousedown', async (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const item = link.closest('.item');
    if (!item) return;

    const titleEl = item.querySelector('h4 a');
    const clickItem = new Item(titleEl.innerText);

    user.recordClick(itemMap.get(clickItem.getHash()));
    items = await reranker.rank(user, items);
    console.log(items);
    sortUI(itemMap);
});

function sortUI(itemMap) {
    let list = document.querySelectorAll('ul.clearfix')[2];
    let itemsTag = Array.from(list.querySelectorAll('.item'));
    itemsTag.sort((a, b) => {
        let titleEl = a.querySelector('h4 a');
        let clickItem = new Item(titleEl.innerText);
        let rankA = itemMap.get(clickItem.getHash()).getScore();

        titleEl = b.querySelector('h4 a');
        clickItem = new Item(titleEl.innerText);
        let rankB = itemMap.get(clickItem.getHash()).getScore();

        return rankB - rankA;
    });

    itemsTag.forEach(item => {
        list.appendChild(item);
    });
}

console.log('inject script initialized');
