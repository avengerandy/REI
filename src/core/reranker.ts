import {User, Item} from './entities';
import {betaPDF, betaRandomSample} from './statistics';

abstract class Reranker {
  /**
   * Rerank the items based on the user profile and the items' embeddings & types.
   * should return same instance (at least same other prototype) of items with updated scores.
   *
   * @param user
   * @param items
   */
  abstract rank(user: User, items: Item[]): Promise<Item[]>;
}

class LILYReranker extends Reranker {
  private count: number;
  private sum: number[];

  constructor(dim: number) {
    super();
    this.count = 0;
    this.sum = new Array(dim).fill(0);
  }

  async rank(user: User, items: Item[]): Promise<Item[]> {
    const clickItems = user.getClickHistory();
    for (const item of clickItems) {
      const embedding = item.getEmbedding();
      if (embedding) {
        this.count += 1;
        for (let i = 0; i < this.sum.length; i++) {
          this.sum[i] += embedding[i];
        }
      }
    }

    for (const item of items) {
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

class AvgCosineReranker extends Reranker {
  private dim: number;

  constructor(dim: number) {
    super();
    this.dim = dim;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < this.dim; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async rank(user: User, items: Item[]): Promise<Item[]> {
    const historyEmbeddings = user
      .getClickHistory()
      .map(item => item.getEmbedding())
      .filter((e): e is number[] => e !== null);

    if (historyEmbeddings.length === 0) {
      items.forEach(item => item.setScore(0));
      return items;
    }

    const dim = this.dim;
    const avgVec = new Array(dim).fill(0);
    for (const emb of historyEmbeddings) {
      for (let i = 0; i < dim; i++) {
        avgVec[i] += emb[i];
      }
    }
    for (let i = 0; i < dim; i++) {
      avgVec[i] /= historyEmbeddings.length;
    }

    for (const item of items) {
      const emb = item.getEmbedding();
      if (emb) {
        item.setScore(this.cosineSimilarity(avgVec, emb));
      } else {
        item.setScore(0);
      }
    }

    return items.sort((a, b) => b.getScore() - a.getScore());
  }
}

class PositiveThompsonReranker extends Reranker {
  private stats: Map<string, {a: number; b: number}> = new Map();
  private NULL_KEY = '__NULL__';

  private recordPositiveFeedback(item: Item): void {
    const t = item.getType();
    const key = t === null ? this.NULL_KEY : String(t);
    const entry = this.stats.get(key) ?? {a: 1, b: 1};
    entry.a += 1;
    this.stats.set(key, entry);
  }

  private ensureTypeKey(key: string): void {
    if (!this.stats.has(key)) {
      this.stats.set(key, {a: 1, b: 1});
    }
  }

  async rank(user: User, items: Item[]): Promise<Item[]> {
    const types = new Set<string>();
    for (const item of items) {
      const t = item.getType();
      const key = t === null ? this.NULL_KEY : String(t);
      types.add(key);
      this.ensureTypeKey(key);
    }

    for (const historyItem of user.getClickHistory()) {
      this.recordPositiveFeedback(historyItem);
    }

    for (const item of items) {
      const t = item.getType();
      const key = t === null ? this.NULL_KEY : String(t);
      const s = this.stats.get(key)!;
      const score = betaRandomSample(s.a, s.b);
      item.setScore(score);
    }

    return items.sort((a, b) => b.getScore() - a.getScore());
  }
}

export {Reranker, LILYReranker, AvgCosineReranker, PositiveThompsonReranker};
