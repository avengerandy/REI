/**
 * @vitest-environment jsdom
 */
import {describe, it, expect, beforeEach, vi} from 'vitest';
import {UserStoreFactory, UserStorageType} from '../../../src/core/storage';
import {User, Item} from '../../../src/core/entities';
import type {IUserStorage} from '../../../src/core/storage';

// ---- Mock chrome.storage.local ----
const chromeData: Record<string, string> = {};
const mockChrome = {
  storage: {
    local: {
      get: vi.fn(async (key: string | string[]) => {
        if (Array.isArray(key)) {
          const result: Record<string, string> = {};
          key.forEach(k => (result[k] = chromeData[k]));
          return result;
        } else {
          return {[key]: chromeData[key]};
        }
      }),
      set: vi.fn(async (items: Record<string, string>) => {
        Object.assign(chromeData, items);
      }),
      remove: vi.fn(async (key: string) => {
        delete chromeData[key];
      }),
      clear: vi.fn(async () => {
        for (const k in chromeData) delete chromeData[k];
      }),
    },
  },
};
vi.stubGlobal('chrome', mockChrome);

const storageTypes = [
  UserStorageType.Local,
  UserStorageType.Session,
  UserStorageType.Memory,
  UserStorageType.ChromeLocal,
];

storageTypes.forEach(type => {
  describe(`${type} store`, () => {
    let store: IUserStorage;
    let user: User;
    let item: Item;

    beforeEach(async () => {
      localStorage.clear();
      sessionStorage.clear();
      for (const k in chromeData) delete chromeData[k];

      store = UserStoreFactory.create(type);
      user = new User();
      item = new Item('hello');
      user.recordClick(item);
    });

    it('should save and load user', async () => {
      await store.save(user);
      const loaded = await store.load();

      expect(loaded).not.toBeNull();
      expect(loaded?.getClickHistory().length).toBe(1);
      expect(loaded?.getClickHistory()[0].getTitle()).toBe('hello');

      const anotherStore = UserStoreFactory.create(type);
      const anotherLoaded = await anotherStore.load();

      expect(anotherLoaded).not.toBeNull();
      expect(anotherLoaded?.getClickHistory().length).toBe(1);
      expect(anotherLoaded?.getClickHistory()[0].getTitle()).toBe('hello');
    });

    it('should clear user', async () => {
      await store.save(user);
      await store.clear();
      const loaded = await store.load();
      expect(loaded).toBeNull();
    });

    it('should loading without saving should return null', async () => {
      const loaded = await store.load();
      expect(loaded).toBeNull();
    });
  });
});
