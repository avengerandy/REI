import {Item, User} from '../core/entities';
import {TextEmbeddingProcessor} from '../core/preProcessor';
import {LILYReranker} from '../core/reranker';
import {ItemRegistry} from '../core/registry';
import {UserStoreFactory, UserStorageType} from '../core/storage';

class BooksUIController {
  private registry: ItemRegistry<HTMLElement>;

  constructor(registry: ItemRegistry<HTMLElement>) {
    this.registry = registry;
  }

  extractItems(): Item[] {
    const list = document.querySelectorAll('ul.clearfix')[2];
    const itemTags = Array.from(list.querySelectorAll('.item'));

    return Array.from(itemTags).map(el => {
      const title = (el.querySelector('h4 a') as HTMLElement)?.innerText ?? '';
      return this.registry.getOrCreate(title, el as HTMLElement);
    });
  }

  sort(items: Item[]): void {
    const list = document.querySelectorAll('ul.clearfix')[2];
    if (!list) return;

    items
      .map(item => {
        const el = this.registry.getSourceByItem(item);
        return {item, el};
      })
      .filter(entry => entry.el)
      .sort((a, b) => b.item.getScore() - a.item.getScore())
      .forEach(({el}) => list.appendChild(el!));
  }

  onItemClick(callback: (item: Item) => Promise<void>): void {
    document.addEventListener('mousedown', async e => {
      const link = (e.target as HTMLElement)?.closest('a');
      if (!link) return;
      const itemEl = link.closest('.item') as HTMLElement;
      if (!itemEl) return;

      const title =
        (itemEl.querySelector('h4 a') as HTMLElement)?.innerText ?? '';
      if (!title) return;

      const item = this.registry.getOrCreate(title, itemEl);
      await callback(item);
    });
  }
}

// --- Main Inject Script ---
void (async () => {
  const store = UserStoreFactory.create(UserStorageType.Local);
  const user = (await store.load()) ?? new User();
  user.setMaxHistorySize(20);

  const processor = new TextEmbeddingProcessor();
  processor.setSigmoidOutput(true);
  processor.setAllowLocalModels(true);
  await processor.init();

  const reranker = new LILYReranker(processor.getModelEmbeddingDim());
  const registry = new ItemRegistry<HTMLElement>();
  const ui = new BooksUIController(registry);

  // processor Recall items
  let items = ui.extractItems();
  items = await processor.process(items);
  const reranked = await reranker.rank(user, items);

  ui.sort(reranked);
  ui.onItemClick(async clickedItem => {
    user.recordClick(clickedItem);
    await store.save(user);
  });

  console.log('Books inject initialized');
})();
