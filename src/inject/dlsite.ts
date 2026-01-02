import {Item, User} from '../core/entities';
import {PLUTOReranker} from '../core/reranker';
import {ItemRegistry} from '../core/registry';
import {UserStoreFactory, UserStorageType} from '../core/storage';

class DlsiteUIController {
  private registry: ItemRegistry<HTMLElement>;

  constructor(registry: ItemRegistry<HTMLElement>) {
    this.registry = registry;
  }

  showAllNewItems(): void {
    [...document.getElementsByClassName('group_see_more')].forEach(el => {
      (el as HTMLElement).click();
    });
  }

  extractItems(): Item[] {
    const list = [...document.getElementsByClassName('n_worklist_item')];
    return list.map(el => {
      const id = (el.querySelector('.work_thumb a') as HTMLElement)?.id ?? '';
      const type =
        (el.querySelector('.work_category a') as HTMLElement)?.innerText ?? '';
      const item = this.registry.getOrCreate(id, el as HTMLElement);
      item.setType(type);
      return item;
    });
  }

  sort(items: Item[]): void {
    // collect and sort items from all .n_worklist, then move them into the first one
    const list = document.querySelectorAll('.n_worklist')[0];
    if (!list) return;

    items
      .map(item => {
        const el = this.registry.getSourceByItem(item);
        return {item, el};
      })
      .filter(entry => entry.el)
      .forEach(({el}) => list.appendChild(el!));
  }

  onItemClick(callback: (item: Item) => Promise<void>): void {
    document.addEventListener('mousedown', async e => {
      const itemEl = (e.target as HTMLElement)?.closest('.n_worklist_item');
      if (!itemEl) return;

      const id =
        (itemEl.querySelector('.work_thumb a') as HTMLElement)?.id ?? '';
      const type =
        (itemEl.querySelector('.work_category a') as HTMLElement)?.innerText ??
        '';
      const item = this.registry.getOrCreate(id, itemEl as HTMLElement);
      item.setType(type);
      await callback(item);
    });
  }
}

// --- Main Inject Script ---
void (async () => {
  const store = UserStoreFactory.create(UserStorageType.Local);
  const user = (await store.load()) ?? new User();
  user.setMaxHistorySize(20);

  const reranker = new PLUTOReranker({T: 10});
  const registry = new ItemRegistry<HTMLElement>();
  const ui = new DlsiteUIController(registry);

  // processor Recall items
  ui.showAllNewItems();
  const items = ui.extractItems();
  const reranked = await reranker.rank(user, items);

  ui.sort(reranked);
  ui.onItemClick(async clickedItem => {
    user.recordClick(clickedItem);
    await store.save(user);
  });

  console.log('Dlsite inject initialized');
})();
