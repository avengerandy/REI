import {describe, it, expect} from 'vitest';
import {ItemRegistry} from '../../../src/core/registry';

describe('ItemRegistry', () => {
  it('should creates and retrieves the same item by title', () => {
    const registry = new ItemRegistry();
    const item1 = registry.getOrCreate('Book A');
    const item2 = registry.getOrCreate('Book A');
    expect(item1).toBe(item2);
  });

  it('should creates distinct items for different titles', () => {
    const registry = new ItemRegistry();
    const itemA = registry.getOrCreate('Book A');
    const itemB = registry.getOrCreate('Book B');
    expect(itemA).not.toBe(itemB);
  });

  it('should associates a source object with an item', () => {
    const registry = new ItemRegistry<{id: number}>();
    const source = {id: 1};
    const item = registry.getOrCreate('Book A', source);
    expect(registry.getSourceByItem(item)).toEqual(source);
  });

  it('should updates the source when getOrCreate is called again with same title', () => {
    const registry = new ItemRegistry<number>();
    const item = registry.getOrCreate('Book A', 1);
    registry.getOrCreate('Book A', 2);
    expect(registry.getSourceByItem(item)).toBe(2);
  });

  it('should returns undefined for items without a source', () => {
    const registry = new ItemRegistry();
    const item = registry.getOrCreate('Book A');
    expect(registry.getSourceByItem(item)).toBeUndefined();
  });

  it('should returns all registered items and sources', () => {
    const registry = new ItemRegistry<string>();
    registry.getOrCreate('A', 'srcA');
    registry.getOrCreate('B', 'srcB');
    const allItems = registry.getAll();
    const allSources = registry.getAllSources();

    expect(allItems.length).toBe(2);
    expect(allSources).toEqual(expect.arrayContaining(['srcA', 'srcB']));
  });

  it('should retrieves item by hash', () => {
    const registry = new ItemRegistry();
    const item = registry.getOrCreate('Book A');
    const found = registry.getByHash(item.getHash());
    expect(found).toBe(item);
  });
});
