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

class TextEmbeddingProcessor extends PreProcessor {
  private static modelName = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
  private static modelEmbeddingDim = 384;

  private pipeline: FeatureExtractionPipeline | null;
  private sigmoidOutput: boolean;
  private allowLocalModels: boolean;

  constructor() {
    super();
    this.pipeline = null;
    this.sigmoidOutput = false;
    this.allowLocalModels = false;
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

export {PreProcessor, TextEmbeddingProcessor};
