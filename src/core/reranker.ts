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
  private dim: number;

  constructor(dim: number) {
    super();
    this.dim = dim;
  }

  async rank(user: User, items: Item[]): Promise<Item[]> {
    const sum = new Array(this.dim).fill(0);
    let count = 0;

    for (const item of user.getClickHistory()) {
      const embedding = item.getEmbedding();
      if (embedding) {
        count += 1;
        for (let i = 0; i < this.dim; i++) {
          sum[i] += embedding[i];
        }
      }
    }

    for (const item of items) {
      const embedding = item.getEmbedding();
      if (embedding) {
        const scores: number[] = [];
        for (let i = 0; i < this.dim; i++) {
          const a = sum[i] + 1;
          const b = count - sum[i] + 1;
          scores.push(betaPDF(embedding[i], a, b));
        }
        const score = scores.reduce((a, b) => a + b, 0) / scores.length;
        item.setScore(score);
      } else {
        item.setScore(0);
      }
    }

    return items.sort((a, b) => b.getScore() - a.getScore());
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
    for (const embedding of historyEmbeddings) {
      for (let i = 0; i < dim; i++) {
        avgVec[i] += embedding[i];
      }
    }
    for (let i = 0; i < dim; i++) {
      avgVec[i] /= historyEmbeddings.length;
    }

    for (const item of items) {
      const embedding = item.getEmbedding();
      if (embedding) {
        item.setScore(this.cosineSimilarity(avgVec, embedding));
      } else {
        item.setScore(0);
      }
    }

    return items.sort((a, b) => b.getScore() - a.getScore());
  }
}

class PositiveThompsonReranker extends Reranker {
  private NULL_KEY = '__NULL__';

  private getKey(item: Item): string {
    const t = item.getType();
    return t === null ? this.NULL_KEY : String(t);
  }

  async rank(user: User, items: Item[]): Promise<Item[]> {
    const counts = new Map<string, number>();
    for (const historyItem of user.getClickHistory()) {
      const key = this.getKey(historyItem);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    for (const item of items) {
      const key = this.getKey(item);
      const a = (counts.get(key) ?? 0) + 1;
      const b = user.getClickHistory().length - (counts.get(key) ?? 0) + 1;
      const score = betaRandomSample(a, b);
      item.setScore(score);
    }

    return items.sort((a, b) => b.getScore() - a.getScore());
  }
}

enum PLUTOUpdateMode {
  Decay = 'decay',
  Window = 'window',
}

interface PlutoOptions {
  alpha?: number; // smoothing
  T?: number; // click increment factor
  mode?: PLUTOUpdateMode;
  gamma?: number; // for decay
  windowSize?: number; // for window
}

class PLUTOReranker extends Reranker {
  private readonly NULL_KEY = '__NULL__';

  private alpha = 1;
  private T = 1;
  private mode = PLUTOUpdateMode.Decay;
  private windowSize = 10;
  private gamma = 0.9;

  constructor(options: PlutoOptions = {}) {
    super();
    if (options.alpha !== undefined) this.alpha = options.alpha;
    if (options.T !== undefined) this.T = options.T;
    if (options.mode !== undefined) this.mode = options.mode;
    if (options.windowSize !== undefined) this.windowSize = options.windowSize;
    if (options.gamma !== undefined) this.gamma = options.gamma;
  }

  private getKey(item: Item): string {
    const t = item.getType();
    return t === null ? this.NULL_KEY : String(t);
  }

  private computeCounts(user: User): Map<string, number> {
    const counts = new Map<string, number>();
    for (const item of user.getClickHistory()) {
      counts.set(this.getKey(item), 0);
    }

    if (this.mode === PLUTOUpdateMode.Decay) {
      for (const click of user.getClickHistory()) {
        // global decay
        for (const [k, v] of counts.entries()) {
          counts.set(k, v * this.gamma);
        }
        // increment clicked tag
        const key = this.getKey(click);
        counts.set(key, (counts.get(key) ?? 0) + this.T);
      }
    } else {
      // Fixed window mode
      const recent = user.getClickHistory().slice(-this.windowSize);
      for (const click of recent) {
        const key = this.getKey(click);
        counts.set(key, (counts.get(key) ?? 0) + this.T);
      }
    }

    return counts;
  }

  /**
   * Convert counts to smoothed probabilities
   */
  private computeProportions(
    counts: Map<string, number>,
    allKeys: Set<string>,
  ): Map<string, number> {
    let total = 0;
    const props = new Map<string, number>();

    for (const key of allKeys) {
      const c = counts.get(key) ?? 0;
      total += c + this.alpha;
    }

    for (const key of allKeys) {
      const c = counts.get(key) ?? 0;
      props.set(key, (c + this.alpha) / total);
    }

    return props;
  }

  /**
   * Roulette wheel selection with mask for unavailable tags
   */
  private rouletteWheelSelect(
    probs: Map<string, number>,
    availableKeys: Set<string>,
  ): string {
    let sum = 0;
    for (const key of availableKeys) {
      sum += probs.get(key)!;
    }

    const r = Math.random() * sum;
    let acc = 0;
    for (const key of availableKeys) {
      acc += probs.get(key)!;
      if (r <= acc) return key;
    }

    // fallback (should not happen)
    return availableKeys.values().next().value!;
  }

  async rank(user: User, items: Item[]): Promise<Item[]> {
    if (items.length === 0) return items;

    // group items by tag
    const typeGroups = new Map<string, Item[]>();
    for (const item of items) {
      const key = this.getKey(item);
      if (!typeGroups.has(key)) typeGroups.set(key, []);
      typeGroups.get(key)!.push(item);
    }

    // sort within each group by original score
    for (const group of typeGroups.values()) {
      group.sort(
        (a, b) => (b.getOriginalScore() ?? 0) - (a.getOriginalScore() ?? 0),
      );
    }

    // compute PLUTO policy ONCE
    const allKeys = new Set(typeGroups.keys());
    const counts = this.computeCounts(user);
    const probs = this.computeProportions(counts, allKeys);

    // rerank with masked roulette wheel
    const finalList: Item[] = [];

    while (finalList.length < items.length) {
      // available tags = tags with remaining items
      const availableKeys = new Set<string>();
      for (const [key, group] of typeGroups.entries()) {
        if (group.length > 0) availableKeys.add(key);
      }

      const key = this.rouletteWheelSelect(probs, availableKeys);
      const group = typeGroups.get(key)!;
      finalList.push(group.shift()!);
    }

    return finalList;
  }
}

export {
  Reranker,
  LILYReranker,
  AvgCosineReranker,
  PositiveThompsonReranker,
  PLUTOUpdateMode,
  PLUTOReranker,
};
