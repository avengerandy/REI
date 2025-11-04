import {describe, it, expect} from 'vitest';
import {TextEmbeddingProcessor} from '../../../src/core/preProcessor';
import {Item} from '../../../src/core/entities';

describe('TextEmbeddingProcessor', () => {
  it('should set empty embedding when process() is called before init', async () => {
    const processor = new TextEmbeddingProcessor();
    const items = [new Item('hello')];
    const processed = await processor.process(items);

    expect(processed[0].getEmbedding()![0]).toEqual(0);
  });

  it('should work whether allowLocalModels true or false', async () => {
    const processor = new TextEmbeddingProcessor();

    processor.setAllowLocalModels(false);
    await processor.init();
    let items = [new Item('test')];
    let result = await processor.process(items);
    expect(result[0].getEmbedding()!.length).toBeGreaterThan(0);

    processor.setAllowLocalModels(true);
    await processor.init();
    items = [new Item('test2')];
    result = await processor.process(items);
    expect(result[0].getEmbedding()!.length).toBeGreaterThan(0);
  });

  it('should embed item titles into embeddings with its dimension', async () => {
    const processor = new TextEmbeddingProcessor();
    await processor.init();

    const items = [new Item('hello world'), new Item('vitest rocks')];
    const result = await processor.process(items);

    expect(result[0].getEmbedding()).not.toBeNull();
    expect(result[1].getEmbedding()).not.toBeNull();

    const emb1 = result[0].getEmbedding()!;
    const emb2 = result[1].getEmbedding()!;

    expect(Array.isArray(emb1)).toBe(true);
    expect(emb1.length).toBeGreaterThan(0);
    expect(emb1.length).toBe(emb2.length);
    expect(emb2.length).toBe(processor.getModelEmbeddingDim());
  });

  it('should produce embeddings with values between 0 and 1', async () => {
    const processor = new TextEmbeddingProcessor();
    await processor.init();
    processor.setSigmoidOutput(true);

    const items = [new Item('hello sigmoid'), new Item('vitest sigmoid')];
    const result = await processor.process(items);

    result.forEach(item => {
      const emb = item.getEmbedding()!;
      emb.forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      });
    });
  });
});
