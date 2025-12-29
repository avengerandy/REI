import {describe, it, expect, beforeEach} from 'vitest';
import {OneHotEncodingProcessor} from '../../../src/core/preProcessor';
import {Item} from '../../../src/core/entities';

describe('OneHotEncodingProcessor', () => {
  let processor: OneHotEncodingProcessor;

  beforeEach(async () => {
    processor = new OneHotEncodingProcessor();
    await processor.init();
  });

  it('should set encoding dimension by getEncodeingDim', async () => {
    const items = [
      new Item('apple'),
      new Item('banana'),
      new Item('cat'),
      new Item('dog'),
    ];
    items[0].setType(0);
    items[1].setType(1);
    items[2].setType(2);
    items[3].setType(2);

    processor.setEncodingDim(items);

    expect(processor.getEncodingDim()).toBe(3);
  });

  it('should automatically set encoding dimension & encode when process() is first called', async () => {
    const items = [
      new Item('apple'),
      new Item('banana'),
      new Item('cat'),
      new Item('dog'),
    ];
    items[0].setType(0);
    items[1].setType(1);
    items[2].setType(2);
    items[3].setType(2);

    await processor.process(items);

    expect(processor.getEncodingDim()).toBe(3);
  });

  it('should encode each type into correct one-hot vector', async () => {
    const items = [new Item('apple'), new Item('dog')];
    items[0].setType(0);
    items[1].setType(1);

    await processor.process(items);

    const emb1 = items[0].getEmbedding()!;
    const emb2 = items[1].getEmbedding()!;

    expect(emb1.filter(v => v === 1).length).toBe(1);
    expect(emb2.filter(v => v === 1).length).toBe(1);
    expect(emb1.length).toBe(emb2.length);
    expect(emb1.length).toBe(processor.getEncodingDim());
    expect(emb1).not.toEqual(emb2);
  });

  it('should encode mixed number and string types into stable one-hot vectors', async () => {
    const items = [new Item('x'), new Item('y'), new Item('z'), new Item('w')];

    items[0].setType('b');
    items[1].setType(1);
    items[2].setType('a');
    items[3].setType(0);

    await processor.process(items);

    const embB = items[0].getEmbedding()!;
    const emb1 = items[1].getEmbedding()!;
    const embA = items[2].getEmbedding()!;
    const emb0 = items[3].getEmbedding()!;

    expect(processor.getEncodingDim()).toBe(4);
    expect(emb0).toEqual([1, 0, 0, 0]);
    expect(emb1).toEqual([0, 1, 0, 0]);
    expect(embA).toEqual([0, 0, 1, 0]);
    expect(embB).toEqual([0, 0, 0, 1]);
  });

  it('should produce same embedding for same type', async () => {
    const items = [new Item('apple'), new Item('banana')];
    items[0].setType(2);
    items[1].setType(2);

    await processor.process(items);

    expect(items[0].getEmbedding()).toEqual(items[1].getEmbedding());
  });

  it('should produce all-zero embedding when type is null', async () => {
    const items = [new Item('apple'), new Item('banana')];
    items[0].setType(0);

    await processor.process(items);

    const emb0 = items[0].getEmbedding()!;
    const emb1 = items[1].getEmbedding()!;

    expect(emb0.filter(v => v === 1).length).toBe(1);
    expect(emb1.every(v => v === 0)).toBe(true);
  });

  it('should produce all-zero embedding when type is not exist', async () => {
    const EncodingItems = [new Item('apple'), new Item('banana')];
    EncodingItems[0].setType(0);
    EncodingItems[1].setType(1);

    processor.setEncodingDim(EncodingItems);

    const items = [new Item('apple'), new Item('banana'), new Item('cat')];
    items[0].setType(0);
    items[1].setType(1);
    items[2].setType(2);

    await processor.process(items);

    const emb0 = items[0].getEmbedding()!;
    const emb1 = items[1].getEmbedding()!;
    const emb2 = items[2].getEmbedding()!;

    expect(emb0.filter(v => v === 1).length).toBe(1);
    expect(emb1.filter(v => v === 1).length).toBe(1);
    expect(emb2.every(v => v === 0)).toBe(true);
  });
});
