import {describe, it, expect} from 'vitest';
import {Item, User} from '../../../src/core/entities';

describe('Item', () => {
  it('should generate hash from title', () => {
    const item = new Item('Hello');
    const hash = item.getHash();
    expect(hash).toBeTypeOf('string');
    expect(hash.length).toBe(32); // md5 length
  });

  it('should set and get properties', () => {
    const item = new Item('Book');
    item.setType(1);
    item.setEmbedding([0.1, 0.2, 0.3]);
    item.setScore(42);
    item.setOriginalScore(10);

    expect(item.getType()).toBe(1);
    expect(item.getEmbedding()).toEqual([0.1, 0.2, 0.3]);
    expect(item.getScore()).toBe(42);
    expect(item.getOriginalScore()).toBe(10);
  });

  it('should serialize and deserialize correctly', () => {
    const item = new Item('Movie');
    item.setType(2);
    item.setEmbedding([1, 2, 3]);
    item.setScore(100);
    item.setOriginalScore(50);

    const json = item.toJSON();
    const restored = Item.fromJSON(json);

    expect(restored.getTitle()).toBe('Movie');
    expect(restored.getHash()).toBe(item.getHash());
    expect(restored.getType()).toBe(2);
    expect(restored.getEmbedding()).toEqual([1, 2, 3]);
    expect(restored.getScore()).toBe(100);
    expect(restored.getOriginalScore()).toBe(50);
  });
});

describe('User', () => {
  it('should record and retrieve click history', () => {
    const user = new User();
    const item1 = new Item('Item 1');
    const item2 = new Item('Item 2');

    user.recordClick(item1);
    user.recordClick(item2);

    const history = user.getClickHistory();
    expect(history.length).toBe(2);
    expect(history[0]).toBe(item1);
    expect(history[1]).toBe(item2);
  });

  it('should respect maxHistorySize', () => {
    const user = new User();
    user.setMaxHistorySize(2);

    user.recordClick(new Item('A'));
    user.recordClick(new Item('B'));
    user.recordClick(new Item('C'));

    const history = user.getClickHistory();
    expect(history.length).toBe(2);
    expect(history[0].getTitle()).toBe('B');
    expect(history[1].getTitle()).toBe('C');

    user.setMaxHistorySize(1);
    const history2 = user.getClickHistory();
    expect(history2.length).toBe(1);
    expect(history[0].getTitle()).toBe('C');
  });

  it('should clear history', () => {
    const user = new User();
    user.recordClick(new Item('X'));
    expect(user.getClickHistory().length).toBe(1);

    user.clearClickHistory();
    expect(user.getClickHistory().length).toBe(0);
  });

  it('should serialize and deserialize correctly', () => {
    const user = new User();
    user.setMaxHistorySize(2);
    user.recordClick(new Item('One'));
    user.recordClick(new Item('Two'));

    const json = user.toJSON();
    const restored = User.fromJSON(json);

    const history = restored.getClickHistory();
    expect(history.length).toBe(2);
    expect(history[0].getTitle()).toBe('One');
    expect(history[1].getTitle()).toBe('Two');

    restored.recordClick(new Item('Three'));
    expect(restored.getClickHistory().length).toBe(2);
  });
});
