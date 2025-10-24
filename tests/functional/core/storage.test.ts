/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { UserStoreFactory, UserStorageType } from '../../../src/core/storage';
import { User, Item } from '../../../src/core/entities';

describe('UserStoreFactory and Stores', () => {
  let user: User;
  let item: Item;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    user = new User();
    item = new Item('hello');
    user.recordClick(item);
  });

  it('should save and load user from localStorage', () => {
    const store = UserStoreFactory.create(UserStorageType.Local);

    store.save(user);
    const loaded = store.load();

    expect(loaded).not.toBeNull();
    expect(loaded?.getClickHistory().length).toBe(1);
    expect(loaded?.getClickHistory()[0].getTitle()).toBe('hello');
  });

  it('should save and load user from sessionStorage', () => {
    const store = UserStoreFactory.create(UserStorageType.Session);

    store.save(user);
    const loaded = store.load();

    expect(loaded).not.toBeNull();
    expect(loaded?.getClickHistory().length).toBe(1);
    expect(loaded?.getClickHistory()[0].getTitle()).toBe('hello');
  });

  it('should clear user from localStorage', () => {
    const store = UserStoreFactory.create(UserStorageType.Local);

    store.save(user);
    store.clear();
    const loaded = store.load();

    expect(loaded).toBeNull();
  });

  it('should clear user from sessionStorage', () => {
    const store = UserStoreFactory.create(UserStorageType.Session);

    store.save(user);
    store.clear();
    const loaded = store.load();

    expect(loaded).toBeNull();
  });

  it('loading without saving should return null', () => {
    const localStore = UserStoreFactory.create(UserStorageType.Local);
    const sessionStore = UserStoreFactory.create(UserStorageType.Session);

    expect(localStore.load()).toBeNull();
    expect(sessionStore.load()).toBeNull();
  });
});
