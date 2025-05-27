import { Item, User } from '../core/entities';
import { EmbeddingProcessor } from '../preProcessor';
import { BetaLikelihoodReranker } from '../reranker';
import { BooksRecall, BooksHotListRecall } from '../recall';

(async () => {
  const user = new User();
  const recall = new BooksHotListRecall();
  const reranker = new BetaLikelihoodReranker();
  const processor = new EmbeddingProcessor();
  await processor.init();

  let items = await processor.process(await recall.recall());
  let itemMap = new Map();
  for (const item of items) {
    itemMap.set(item.getHash(), item);
  }

  function sortUI(itemMap: Map<string, Item>) {
    let list = document.querySelectorAll('ul.clearfix')[2];
    let itemsTag = Array.from(list.querySelectorAll('.item'));
    itemsTag.sort((a, b) => {
      const aTitle = (a.querySelector('h4 a') as HTMLElement)?.innerText ?? '';
      const bTitle = (b.querySelector('h4 a') as HTMLElement)?.innerText ?? '';
      const rankA = itemMap.get(new Item(aTitle).getHash())?.getScore() ?? 0;
      const rankB = itemMap.get(new Item(bTitle).getHash())?.getScore() ?? 0;
      return rankB - rankA;
    });
    itemsTag.forEach(item => list.appendChild(item));
  }

  document.addEventListener('mousedown', async (e) => {
    const link = (e.target as HTMLElement)?.closest('a');
    if (!link) return;
    const itemEl = link.closest('.item');
    if (!itemEl) return;

    const titleEl = itemEl.querySelector('h4 a');
    if (!titleEl) return;

    const clickItem = new Item((titleEl as HTMLElement).innerText);
    user.recordClick(itemMap.get(clickItem.getHash())!);

    items = await reranker.rank(user, items);
    sortUI(itemMap);
  });

  console.log('inject initialized');
})();
