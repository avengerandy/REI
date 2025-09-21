import {Item} from './entities';

class ItemRegistry<T = unknown> {
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

export {ItemRegistry};
