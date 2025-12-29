import {Item, User} from '../core/entities';
import {TextEmbeddingProcessor} from '../core/preProcessor';
import {AvgCosineReranker} from '../core/reranker';
import {ItemRegistry} from '../core/registry';

class TenlongUIController {
  private registry: ItemRegistry<HTMLElement>;

  constructor(registry: ItemRegistry<HTMLElement>) {
    this.registry = registry;
  }

  private getItemsByHeader(headerText: string): Item[] {
    const h2Links = [...document.querySelectorAll('h2 a')];
    const targetLink = h2Links.find(a => a.textContent?.trim() === headerText);
    if (!targetLink) return [];

    const container = targetLink.parentElement?.nextElementSibling;
    if (!container) return [];

    const bookEls = [...container.querySelectorAll('.single-book')];
    return bookEls.map(el => {
      const titleEl = el.querySelector('strong.title a') as HTMLElement;
      const title = titleEl?.innerText?.trim() ?? '';
      return this.registry.getOrCreate(title, el as HTMLElement);
    });
  }

  private sortItems(items: Item[], headerText: string) {
    const h2Links = [...document.querySelectorAll('h2 a')];
    const targetLink = h2Links.find(a => a.textContent?.trim() === headerText);
    if (!targetLink) return;

    const container =
      targetLink.parentElement?.nextElementSibling?.querySelector(
        '.list-wrapper ul',
      );
    if (!container) return;

    items
      .map(item => ({item: item, el: this.registry.getSourceByItem(item)}))
      .filter(entry => entry.el)
      .sort((a, b) => b.item.getScore() - a.item.getScore())
      .forEach(item => container.appendChild(item.el!));
  }

  getUserHistory(): Item[] {
    const h2 = [...document.querySelectorAll('h2')].find(el =>
      el.textContent.includes('最後瀏覽商品'),
    );
    if (!h2) return [];
    const container = h2.closest('.content')?.querySelector('.book-list');
    if (!container) return [];

    const titles = [...container.querySelectorAll('.single-book .title a')].map(
      a => a.textContent.trim(),
    );
    return titles.map(title => new Item(title));
  }

  getZhTwItems(): Item[] {
    return this.getItemsByHeader('中文新書');
  }

  sortZhTwItems(items: Item[]): void {
    this.sortItems(items, '中文新書');
  }

  getEnItems(): Item[] {
    return this.getItemsByHeader('英文新書');
  }

  sortEnItems(items: Item[]): void {
    this.sortItems(items, '英文新書');
  }

  getZhCnItems(): Item[] {
    return this.getItemsByHeader('簡中新書');
  }

  sortZhCnItems(items: Item[]): void {
    this.sortItems(items, '簡中新書');
  }
}

// --- Main Inject Script ---
void (async () => {
  const user = new User();
  const registry = new ItemRegistry<HTMLElement>();
  const ui = new TenlongUIController(registry);
  const processor = new TextEmbeddingProcessor();
  processor.setAllowLocalModels(true);
  const reranker = new AvgCosineReranker(processor.getModelEmbeddingDim());

  await processor.init();

  // process user history
  let userHistoryItems = ui.getUserHistory();
  console.log(userHistoryItems);
  userHistoryItems = await processor.process(userHistoryItems);
  userHistoryItems.forEach(item => user.recordClick(item));

  // process & sort items per language
  const zhTwItems = await processor.process(ui.getZhTwItems());
  console.log(zhTwItems);
  ui.sortZhTwItems(await reranker.rank(user, zhTwItems));

  const enItems = await processor.process(ui.getEnItems());
  console.log(enItems);

  ui.sortEnItems(await reranker.rank(user, enItems));

  const zhCnItems = await processor.process(ui.getZhCnItems());
  console.log(zhCnItems);

  ui.sortZhCnItems(await reranker.rank(user, zhCnItems));

  console.log('Tenlong inject initialized');
})();
