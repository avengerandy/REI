import {md5} from 'js-md5';

class Item {
  private title: string;
  private hash: string;
  private type: string | number | null;
  private embedding: number[] | null;
  private score: number;
  private originalScore: number | null;

  constructor(title: string) {
    this.title = title;
    this.hash = this.generateHash(title);
    this.type = null;
    this.embedding = null;
    this.score = 0;
    this.originalScore = null;
  }

  getTitle(): string {
    return this.title;
  }

  getHash(): string {
    return this.hash;
  }

  setType(type: string | number): void {
    this.type = type;
  }

  getType(): string | number | null {
    return this.type;
  }

  setEmbedding(embedding: number[]): void {
    this.embedding = embedding;
  }

  getEmbedding(): number[] | null {
    return this.embedding;
  }

  setScore(score: number): void {
    this.score = score;
  }

  getScore(): number {
    return this.score;
  }

  setOriginalScore(originalScore: number): void {
    this.originalScore = originalScore;
  }

  getOriginalScore(): number | null {
    return this.originalScore;
  }

  private generateHash(title: string): string {
    const data = JSON.stringify({title: title});
    return md5(data);
  }

  toJSON(): string {
    return JSON.stringify({
      title: this.title,
      hash: this.hash,
      type: this.type,
      embedding: this.embedding,
      score: this.score,
      originalScore: this.originalScore,
    });
  }

  static fromJSON(json: string): Item {
    const data = JSON.parse(json);
    const item = new Item(data.title);
    item.hash = data.hash;
    item.type = data.type;
    item.embedding = data.embedding;
    item.score = data.score;
    item.originalScore = data.originalScore;
    return item;
  }
}

class User {
  private clickHistory: Item[];
  private maxHistorySize = Infinity; // Default to no limit

  constructor() {
    this.clickHistory = [];
  }

  setMaxHistorySize(size: number): void {
    this.maxHistorySize = size;
    while (this.clickHistory.length > this.maxHistorySize) {
      this.clickHistory.shift();
    }
  }

  recordClick(item: Item): void {
    this.clickHistory.push(item);
    if (this.clickHistory.length > this.maxHistorySize) {
      this.clickHistory.shift();
    }
  }

  getClickHistory(): Item[] {
    return this.clickHistory;
  }

  clearClickHistory(): void {
    this.clickHistory = [];
  }

  toJSON(): string {
    const maxHistorySize =
      this.maxHistorySize === Infinity ? null : this.maxHistorySize;
    return JSON.stringify({
      maxHistorySize: maxHistorySize,
      clickHistory: this.clickHistory.map(item => item.toJSON()),
    });
  }

  static fromJSON(json: string): User {
    const data = JSON.parse(json);
    const user = new User();
    user.clickHistory = data.clickHistory.map((itemJson: string) => {
      return Item.fromJSON(itemJson);
    });
    if (data.maxHistorySize !== null) {
      user.setMaxHistorySize(data.maxHistorySize);
    }
    return user;
  }
}

export {User, Item};
