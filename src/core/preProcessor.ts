import {
  FeatureExtractionPipeline,
  pipeline,
  env,
} from '@huggingface/transformers';
import {Item} from './entities';

abstract class PreProcessor {
  abstract init(): Promise<void>;
  abstract process(items: Item[]): Promise<Item[]>;
}

abstract class EmbeddingProcessor extends PreProcessor {
  abstract getModelEmbeddingDim(): number;
  abstract init(): Promise<void>;
  abstract process(items: Item[]): Promise<Item[]>;
}

abstract class EncodingProcessor extends PreProcessor {
  abstract setEncodingDim(items: Item[]): void;
  abstract getEncodingDim(): number;
  abstract init(): Promise<void>;
  abstract process(items: Item[]): Promise<Item[]>;
}

class TextEmbeddingProcessor extends EmbeddingProcessor {
  private static modelName = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
  private static modelEmbeddingDim = 384;

  private pipeline: FeatureExtractionPipeline | null = null;
  private sigmoidOutput = false;
  private allowLocalModels = false;

  getModelEmbeddingDim(): number {
    return TextEmbeddingProcessor.modelEmbeddingDim;
  }

  setSigmoidOutput(sigmoidOutput: boolean): void {
    this.sigmoidOutput = sigmoidOutput;
  }

  setAllowLocalModels(allowLocalModels: boolean): void {
    this.allowLocalModels = allowLocalModels;
  }

  async init(): Promise<void> {
    env.allowLocalModels = this.allowLocalModels;

    const featureExtractionPipeline = await pipeline(
      'feature-extraction',
      TextEmbeddingProcessor.modelName,
      {
        dtype: 'q8',
      },
    );

    this.pipeline = featureExtractionPipeline;
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (!this.pipeline) {
      return texts.map(() => {
        return Array(TextEmbeddingProcessor.modelEmbeddingDim).fill(0);
      });
    }
    const output = await this.pipeline(texts, {
      pooling: 'mean',
      normalize: false,
    });

    if (this.sigmoidOutput) {
      return output.sigmoid().tolist();
    }
    return output.tolist();
  }

  async process(items: Item[]): Promise<Item[]> {
    const titles = items.map(item => item.getTitle());
    const embeddings = await this.embed(titles);

    items.forEach((item, index) => {
      item.setEmbedding(embeddings[index]);
    });
    return items;
  }
}

class OneHotEncodingProcessor extends EncodingProcessor {
  private typeVocab: number[] = [];

  setEncodingDim(items: Item[]): void {
    const types = new Set<number>();
    for (const item of items) {
      const t = item.getType();
      if (t !== null) types.add(t);
    }
    this.typeVocab = Array.from(types).sort((a, b) => a - b); // 排序方便穩定索引
  }

  getEncodingDim(): number {
    return this.typeVocab.length;
  }

  async init(): Promise<void> {
    return;
  }

  async process(items: Item[]): Promise<Item[]> {
    if (this.typeVocab.length === 0) {
      this.setEncodingDim(items);
    }

    const vocabIndex = new Map<number, number>(
      this.typeVocab.map((t, i) => [t, i]),
    );

    for (const item of items) {
      const vec = Array(this.typeVocab.length).fill(0);
      const t = item.getType();
      if (t !== null) {
        const idx = vocabIndex.get(t);
        if (idx !== undefined) vec[idx] = 1;
      }
      item.setEmbedding(vec);
    }

    return items;
  }
}

export {PreProcessor, TextEmbeddingProcessor, OneHotEncodingProcessor};
