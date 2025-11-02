import {Item, User} from '../core/entities';
import {TextEmbeddingProcessor} from '../core/preProcessor';
import {BetaLikelihoodReranker} from '../core/reranker';
import {ItemRegistry} from '../core/registry';
import {UIController} from '../core/uiController';

class BooksUIController implements UIController {
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
  const user = new User();
  const registry = new ItemRegistry<HTMLElement>();
  const ui = new BooksUIController(registry);
  const reranker = new BetaLikelihoodReranker();
  const processor = new TextEmbeddingProcessor();

  await processor.init();

  // Recall items
  let items = ui.extractItems();
  items = await processor.process(items);

  ui.sort(items);

  ui.onItemClick(async clickedItem => {
    user.recordClick(clickedItem);
    const reranked = await reranker.rank(user, registry.getAll());
    ui.sort(reranked);
  });

  console.log('Books inject initialized with generic ItemRegistry');
})();
