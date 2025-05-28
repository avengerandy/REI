import { Item, User } from '../core/entities';
import { EmbeddingProcessor } from '../preProcessor';
import { BetaLikelihoodReranker } from '../reranker';

class ItemRegistry {
    private map: Map<string, Item>;

    constructor() {
        this.map = new Map();
    }

    getOrCreate(title: string): Item {
        const item = new Item(title);
        const hash = item.getHash();
        if (!this.map.has(hash)) {
            this.map.set(hash, item);
        }
        return this.map.get(hash)!;
    }

    getByHash(hash: string): Item | undefined {
        return this.map.get(hash);
    }

    getAll(): Item[] {
        return Array.from(this.map.values());
    }
}

interface UIController {
    extractItems(): Item[];
    sort(items: Item[]): void;
    onItemClick(callback: (item: Item) => void): void;
}

class BooksUIController implements UIController {
    private registry: ItemRegistry;

    constructor(registry: ItemRegistry) {
        this.registry = registry;
    }

    extractItems(): Item[] {
        const titleEls: HTMLCollectionOf<HTMLHeadingElement> = document.getElementsByTagName("h4");
        return Array.from(titleEls).map(el => {
            const title = (el as HTMLElement).innerText;
            return this.registry.getOrCreate(title);
        });
    }

    sort(items: Item[]): void {
        const list = document.querySelectorAll('ul.clearfix')[2];
        const itemTags = Array.from(list.querySelectorAll('.item'));

        itemTags.sort((a, b) => {
            const aTitle = (a.querySelector('h4 a') as HTMLElement)?.innerText ?? '';
            const bTitle = (b.querySelector('h4 a') as HTMLElement)?.innerText ?? '';
            const aScore = this.registry.getOrCreate(aTitle).getScore();
            const bScore = this.registry.getOrCreate(bTitle).getScore();
            return bScore - aScore;
        });

        itemTags.forEach(tag => list.appendChild(tag));
    }

    onItemClick(callback: (item: Item) => void): void {
        document.addEventListener('mousedown', (e) => {
            const link = (e.target as HTMLElement)?.closest('a');
            if (!link) return;
            const itemEl = link.closest('.item');
            if (!itemEl) return;

            const titleEl = itemEl.querySelector('h4 a');
            if (!titleEl) return;

            const title = (titleEl as HTMLElement).innerText;
            const item = this.registry.getOrCreate(title);
            callback(item);
        });
    }
}

// --- Main Inject Script ---
(async () => {
    const user = new User();
    const registry = new ItemRegistry();
    const ui = new BooksUIController(registry);
    const reranker = new BetaLikelihoodReranker();
    const processor = new EmbeddingProcessor();
    await processor.init();

    // Recall and embed
    let items = ui.extractItems();
    items = await processor.process(items);

    // update registry with embeddings
    for (const item of items) {
        registry.getOrCreate(item.getTitle()).setEmbedding(item.getEmbedding()!);
    }

    ui.sort(items);

    ui.onItemClick(async (clickedItem) => {
        user.recordClick(clickedItem);
        const reranked = await reranker.rank(user, registry.getAll());
        ui.sort(reranked);
    });

    console.log('Books inject initialized with ItemRegistry');
})();
