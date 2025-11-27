import {describe, it, expect} from 'vitest';
import {User, Item} from '../../../src/core/entities';
import {
  LILYReranker,
  AvgCosineReranker,
  PositiveThompsonReranker,
} from '../../../src/core/reranker';

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

describe('PositiveThompsonReranker (Functional)', () => {
  it('should rank positively reinforced types higher on average', async () => {
    const user = new User();

    // simulate type clicks
    const clicked = new Item('clicked');
    clicked.setType(0);
    user.recordClick(clicked); // A: a=2, b=1

    const items = [new Item('a1'), new Item('a2'), new Item('b1')];

    items[0].setType(0);
    items[1].setType(0);
    items[2].setType(1); // never clicked → Beta(1,1)

    const reranker = new PositiveThompsonReranker();

    // run multiple sampling iterations
    let zeroWins = 0;
    const RUNS = 1000;

    for (let i = 0; i < RUNS; i++) {
      const ranked = await reranker.rank(user, [...items]);
      if (ranked[0].getType() === 0) zeroWins++;
    }

    // A should be first significantly more than half the time
    expect(zeroWins / RUNS).toBeGreaterThan(0.6);
  });

  it('should handle empty click history gracefully', async () => {
    const user = new User();
    const items = [
      new Item('x'),
      new Item('y'),
      new Item('z'),
    ];
    items[0].setType(0);
    items[1].setType(1);
    items[2].setType(2);

    const reranker = new PositiveThompsonReranker();
    const ranked = await reranker.rank(user, items);

    expect(ranked.length).toBe(3);

    // all scores should be valid numbers between 0 and 1
    for (const item of ranked) {
      const score = item.getScore();
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    }
  });

  it('should handle null type by assigning default Beta(1,1)', async () => {
    const user = new User();
    const item = new Item('null-item');

    const reranker = new PositiveThompsonReranker();
    const ranked = await reranker.rank(user, [item]);

    expect(typeof ranked[0].getScore()).toBe('number');
    expect(ranked[0].getScore()).toBeGreaterThanOrEqual(0);
    expect(ranked[0].getScore()).toBeLessThanOrEqual(1);
  });
});
