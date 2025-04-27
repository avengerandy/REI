import { pipeline, env } from '@huggingface/transformers';
import { Item } from "./core/entities";

env.allowLocalModels = false;

abstract class PreProcessor {
    abstract init(): Promise<void>;
    abstract process(items: Item[]): Promise<Item[]>;
}

class EmbeddingProcessor extends PreProcessor {
    private static modelName = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
    private pipeline: any;

    constructor() {
        super();
        this.pipeline = null;
    }

    async init(): Promise<void> {
        this.pipeline = await pipeline(
            'feature-extraction',
            EmbeddingProcessor.modelName, {
            dtype: "q8"
        });
    }

    async embed(texts: string[]): Promise<number[][]> {
        const output = await this.pipeline(texts, {
            pooling: 'mean',
            normalize: false
        });

        return output.sigmoid().tolist();
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

export { PreProcessor, EmbeddingProcessor };
