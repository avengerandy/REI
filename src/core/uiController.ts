import {Item} from './entities';

interface UIController {
  extractItems(): Item[];
  sort(items: Item[]): void;
  onItemClick(callback: (item: Item) => Promise<void>): void;
}

export {UIController};
