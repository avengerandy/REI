import { md5 } from 'js-md5';

class Item {
    private title: string;
    private hash: string;
    private type: number | null;
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

    setType(type: number): void {
        this.type = type;
    }

    getType(): number | null {
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
        const data = JSON.stringify({ 'title': title });
        return md5(data);
    }
}

class User {
    private clickHistory: Item[];

    constructor() {
        this.clickHistory = [];
    }

    recordClick(item: Item): void {
        this.clickHistory.push(item);
    }

    getClickHistory(): Item[] {
        return this.clickHistory;
    }
}

export { User, Item };
