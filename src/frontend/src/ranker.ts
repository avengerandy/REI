import { Item } from "./core/entities";

abstract class Ranker {
    abstract rank(items: Item[]): Item[];
}

class ScoreRanker extends Ranker {
    rank(items: Item[]): Item[] {
        return items.sort((a, b) => b.getScore() - a.getScore());
    }
}

export { Ranker, ScoreRanker };
