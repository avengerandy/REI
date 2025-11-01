import {User} from './entities';

enum UserStorageType {
  Local = 'local',
  Session = 'session',
  Memory = 'memory',
  ChromeLocal = 'chromeLocal',
}

interface IUserStorage {
  save(user: User): Promise<void>;
  load(): Promise<User | null>;
  clear(): Promise<void>;
}

class LocalStorageUserStore implements IUserStorage {
  private readonly key = 'rei-user-data';

  async save(user: User): Promise<void> {
    localStorage.setItem(this.key, user.toJSON());
  }

  async load(): Promise<User | null> {
    const json = localStorage.getItem(this.key);
    return json ? User.fromJSON(json) : null;
  }

  async clear(): Promise<void> {
    localStorage.removeItem(this.key);
  }
}

class SessionStorageUserStore implements IUserStorage {
  private readonly key = 'rei-user-data';

  async save(user: User): Promise<void> {
    sessionStorage.setItem(this.key, user.toJSON());
  }

  async load(): Promise<User | null> {
    const json = sessionStorage.getItem(this.key);
    return json ? User.fromJSON(json) : null;
  }

  async clear(): Promise<void> {
    sessionStorage.removeItem(this.key);
  }
}

class MemoryUserStore implements IUserStorage {
  private user: User | null = null;

  async save(user: User): Promise<void> {
    this.user = user;
  }

  async load(): Promise<User | null> {
    return this.user;
  }

  async clear(): Promise<void> {
    this.user = null;
  }
}

class ChromeStorageUserStore implements IUserStorage {
  private readonly key = 'rei-user-data';
  private cache: User | null = null;

  constructor() {}

  async save(user: User): Promise<void> {
    this.cache = user;
    await chrome.storage.local.set({[this.key]: user.toJSON()});
  }

  async load(): Promise<User | null> {
    if (this.cache) return this.cache;
    const result = await chrome.storage.local.get(this.key);
    const json = result[this.key];
    if (json) this.cache = User.fromJSON(json);
    return this.cache;
  }

  async clear(): Promise<void> {
    this.cache = null;
    await chrome.storage.local.remove(this.key);
  }
}

class UserStoreFactory {
  static create(type: UserStorageType): IUserStorage {
    switch (type) {
      case UserStorageType.Local:
        return new LocalStorageUserStore();
      case UserStorageType.Session:
        return new SessionStorageUserStore();
      case UserStorageType.Memory:
        return new MemoryUserStore();
      case UserStorageType.ChromeLocal:
        return new ChromeStorageUserStore();
    }
  }
}

export {UserStorageType, UserStoreFactory, IUserStorage};
