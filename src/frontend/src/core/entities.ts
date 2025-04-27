import { md5 } from 'js-md5';

class Item {
    private title: string;
    private hash: string;
    private embedding: number[] | null;
    private score: number;
    private originalScore: number;

    constructor(title: string) {
        this.title = title;
        this.hash = this.generateHash(title);
        this.embedding = null;
        this.score = 0;
        this.originalScore = 0;
    }

    getTitle(): string {
        return this.title;
    }

    getHash(): string {
        return this.hash;
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

    getOriginalScore(): number {
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
