import {describe, it, expect, beforeAll} from 'vitest';
import {EmbeddingProcessor} from '../../../src/core/preProcessor';
import {Item} from '../../../src/core/entities';

describe('EmbeddingProcessor', () => {
  describe('without init', () => {
    it('should set empty embedding when process() is called before init', async () => {
      const processor = new EmbeddingProcessor();
      const items = [new Item('hello')];
      const processed = await processor.process(items);

      expect(processed[0].getEmbedding()).toEqual([]);
    });
  });

  describe('with init', () => {
    let processor: EmbeddingProcessor;

    beforeAll(async () => {
      processor = new EmbeddingProcessor();
      await processor.init();
    }, 30_000);

    it('should embed item titles into embeddings', async () => {
      const items = [new Item('hello world'), new Item('vitest rocks')];
      const result = await processor.process(items);

      expect(result[0].getEmbedding()).not.toBeNull();
      expect(result[1].getEmbedding()).not.toBeNull();

      const emb1 = result[0].getEmbedding()!;
      const emb2 = result[1].getEmbedding()!;

      expect(Array.isArray(emb1)).toBe(true);
      expect(emb1.length).toBeGreaterThan(0);
      expect(emb1.length).toBe(emb2.length);
    });
  });
});
