import {describe, it, expect} from 'vitest';
import {User, Item} from '../../../src/core/entities';
import {LILYReranker, AvgCosineReranker} from '../../../src/core/reranker';

describe('LILYReranker (Functional)', () => {
  it('should rank items higher if user has clicked similar embeddings', async () => {
    const user = new User();

    const clicked1 = new Item('clicked1');
    clicked1.setEmbedding([0.9, 0.8, 0.7]);
    const clicked2 = new Item('clicked2');
    clicked2.setEmbedding([0.85, 0.82, 0.75]);
    user.recordClick(clicked1);
    user.recordClick(clicked2);

    const items = [new Item('similar'), new Item('different')];
    items[0].setEmbedding([0.88, 0.79, 0.7]);
    items[1].setEmbedding([0.1, 0.2, 0.3]);

    const reranker = new LILYReranker(3);
    const ranked = await reranker.rank(user, items);

    expect(ranked[0].getTitle()).toBe('similar');
    expect(ranked[0].getScore()).toBeGreaterThan(ranked[1].getScore());
  });

  it('should handle empty click history gracefully', async () => {
    const user = new User();
    const items = [new Item('a'), new Item('b')];
    items[0].setEmbedding([0.3, 0.4, 0.5]);
    items[1].setEmbedding([0.6, 0.7, 0.8]);

    const reranker = new LILYReranker(3);
    const ranked = await reranker.rank(user, items);

    expect(ranked.length).toBe(2);
    expect(typeof ranked[0].getScore()).toBe('number');
  });

  it('should skip items without embeddings', async () => {
    const user = new User();

    const clicked1 = new Item('no embedding');
    const clicked2 = new Item('with embedding');
    clicked2.setEmbedding([0.5, 0.6, 0.7]);
    user.recordClick(clicked1);
    user.recordClick(clicked2);

    const items = [new Item('no embedding'), new Item('with embedding')];
    items[1].setEmbedding([0.5, 0.6, 0.7]);

    const reranker = new LILYReranker(3);
    const ranked = await reranker.rank(user, items);

    expect(ranked.length).toBe(2);
    expect(ranked[0].getTitle()).toBe('with embedding');
  });

  it('should produce zero embedding', async () => {
    const user = new User();
    const clicked = new Item('clicked');
    clicked.setEmbedding([0, 0, 0]);
    user.recordClick(clicked);

    const items = [new Item('same'), new Item('different')];
    items[0].setEmbedding([1, 2, 3]);
    items[1].setEmbedding([5, 5, 5]);

    const reranker = new LILYReranker(3);
    const ranked = await reranker.rank(user, items);

    expect(ranked[0].getScore()).toBeCloseTo(0, 6);
    expect(ranked[1].getScore()).toBeCloseTo(0, 6);
  });
});

describe('AvgCosineReranker (Functional)', () => {
  it('should rank items higher if user has clicked similar embeddings', async () => {
    const user = new User();

    const clicked1 = new Item('clicked1');
    clicked1.setEmbedding([0.9, 0.8, 0.7]);
    const clicked2 = new Item('clicked2');
    clicked2.setEmbedding([0.85, 0.82, 0.75]);
    user.recordClick(clicked1);
    user.recordClick(clicked2);

    const items = [new Item('similar'), new Item('different')];
    items[0].setEmbedding([0.88, 0.79, 0.7]);
    items[1].setEmbedding([0.1, 0.2, 0.3]);

    const reranker = new AvgCosineReranker(3);
    const ranked = await reranker.rank(user, items);

    expect(ranked[0].getTitle()).toBe('similar');
    expect(ranked[0].getScore()).toBeGreaterThan(ranked[1].getScore());
  });

  it('should handle empty click history gracefully', async () => {
    const user = new User();
    const items = [new Item('a'), new Item('b')];
    items[0].setEmbedding([0.3, 0.4, 0.5]);
    items[1].setEmbedding([0.6, 0.7, 0.8]);

    const reranker = new AvgCosineReranker(3);
    const ranked = await reranker.rank(user, items);

    expect(ranked.length).toBe(2);
    expect(ranked[0].getScore()).toBe(0);
    expect(ranked[1].getScore()).toBe(0);
  });

  it('should skip items without embeddings', async () => {
    const user = new User();

    const clicked1 = new Item('with embedding');
    clicked1.setEmbedding([0.5, 0.6, 0.7]);
    user.recordClick(clicked1);

    const items = [new Item('no embedding'), new Item('with embedding')];
    items[1].setEmbedding([0.5, 0.6, 0.7]);

    const reranker = new AvgCosineReranker(3);
    const ranked = await reranker.rank(user, items);

    expect(ranked.length).toBe(2);
    expect(ranked[0].getTitle()).toBe('with embedding');
    expect(ranked[0].getScore()).toBeGreaterThan(0);
    expect(ranked[1].getScore()).toBe(0);
  });

  it('should produce zero embedding', async () => {
    const user = new User();
    const clicked = new Item('clicked');
    clicked.setEmbedding([0, 0, 0]);
    user.recordClick(clicked);

    const items = [new Item('same'), new Item('different')];
    items[0].setEmbedding([1, 2, 3]);
    items[1].setEmbedding([5, 5, 5]);

    const reranker = new AvgCosineReranker(3);
    const ranked = await reranker.rank(user, items);

    expect(ranked[0].getScore()).toBeCloseTo(0, 6);
    expect(ranked[1].getScore()).toBeCloseTo(0, 6);
  });
});
