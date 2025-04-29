import { User, Item } from "./core/entities";
import { betaPDF } from "./core/statistics";

abstract class Reranker {
    abstract rank(user: User, items: Item[]): Promise<Item[]>;
}

class BetaLikelihoodReranker extends Reranker {
    private count: number;
    private sum: number[];

    constructor(dim: number = 384) {
        super();
        this.count = 0;
        this.sum = new Array(dim).fill(0);
    }

    async rank(user: User, items: Item[]): Promise<Item[]> {
        let clickItems = user.getClickHistory();
        for (let item of clickItems) {
            const embedding = item.getEmbedding();
            if (embedding) {
                this.count += 1;
                for (let i = 0; i < this.sum.length; i++) {
                    this.sum[i] += embedding[i];
                }
            }
        }

        for (let item of items) {
            const embedding = item.getEmbedding();
            if (embedding) {
                const scores = this.getBetaScores(embedding);
                const score = scores.reduce((a, b) => a + b, 0) / scores.length;
                item.setScore(score);
            }
        }

        return Promise.resolve(items.sort((a, b) => b.getScore() - a.getScore()));
    }

    private getBetaScores(vec: number[]): number[] {
        const scores: number[] = [];
        for (let i = 0; i < vec.length; i++) {
            const a = this.sum[i] + 1;
            const b = this.count - this.sum[i] + 1;
            const x = vec[i];
            scores.push(betaPDF(x, a, b));
        }
        return scores;
    }
}

export { Reranker, BetaLikelihoodReranker };
