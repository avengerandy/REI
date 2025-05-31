import { Item, User } from '../core/entities';
import { EmbeddingProcessor } from '../core/preProcessor';
import { BetaLikelihoodReranker } from '../core/reranker';

// generic ItemRegistry
class ItemRegistry<T = any> {
    private itemMap: Map<string, Item>;
    private sourceMap: Map<string, T>;

    constructor() {
        this.itemMap = new Map();
        this.sourceMap = new Map();
    }

    getOrCreate(title: string, source?: T): Item {
        const item = new Item(title);
        const hash = item.getHash();
        if (!this.itemMap.has(hash)) {
            this.itemMap.set(hash, item);
            if (source !== undefined) {
                this.sourceMap.set(hash, source);
            }
        } else if (source !== undefined) {
            this.sourceMap.set(hash, source);
        }
        return this.itemMap.get(hash)!;
    }

    getByHash(hash: string): Item | undefined {
        return this.itemMap.get(hash);
    }

    getSourceByItem(item: Item): T | undefined {
        return this.sourceMap.get(item.getHash());
    }

    getAll(): Item[] {
        return Array.from(this.itemMap.values());
    }

    getAllSources(): T[] {
        return Array.from(this.sourceMap.values());
    }
}

interface UIController {
    extractItems(): Item[];
    sort(items: Item[]): void;
    onItemClick(callback: (item: Item) => void): void;
}

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
                return { item, el };
            })
            .filter(entry => entry.el)
            .sort((a, b) => b.item.getScore() - a.item.getScore())
            .forEach(({ el }) => list.appendChild(el!));
    }

    onItemClick(callback: (item: Item) => void): void {
        document.addEventListener('mousedown', (e) => {
            const link = (e.target as HTMLElement)?.closest('a');
            if (!link) return;
            const itemEl = link.closest('.item') as HTMLElement;
            if (!itemEl) return;

            const title = (itemEl.querySelector('h4 a') as HTMLElement)?.innerText ?? '';
            if (!title) return;

            const item = this.registry.getOrCreate(title, itemEl);
            callback(item);
        });
    }
}

// --- Main Inject Script ---
(async () => {
    const user = new User();
    const registry = new ItemRegistry<HTMLElement>();
    const ui = new BooksUIController(registry);
    const reranker = new BetaLikelihoodReranker();
    const processor = new EmbeddingProcessor();

    await processor.init();

    // Recall items
    let items = ui.extractItems();
    items = await processor.process(items);

    ui.sort(items);

    ui.onItemClick(async (clickedItem) => {
        user.recordClick(clickedItem);
        const reranked = await reranker.rank(user, registry.getAll());
        ui.sort(reranked);
    });

    console.log('Books inject initialized with generic ItemRegistry');
})();
