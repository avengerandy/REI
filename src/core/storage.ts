import {User} from './entities';

enum UserStorageType {
  Local = 'local',
  Session = 'session',
}

interface IUserStorage {
  save(user: User): void;
  load(): User | null;
  clear(): void;
}

class LocalStorageUserStore implements IUserStorage {
  private readonly key = 'rei-user-data';

  save(user: User): void {
    localStorage.setItem(this.key, user.toJSON());
  }

  load(): User | null {
    const json = localStorage.getItem(this.key);
    return json ? User.fromJSON(json) : null;
  }

  clear(): void {
    localStorage.removeItem(this.key);
  }
}

class SessionStorageUserStore implements IUserStorage {
  private readonly key = 'rei-user-data';

  save(user: User): void {
    sessionStorage.setItem(this.key, user.toJSON());
  }

  load(): User | null {
    const json = sessionStorage.getItem(this.key);
    return json ? User.fromJSON(json) : null;
  }

  clear(): void {
    sessionStorage.removeItem(this.key);
  }
}

class UserStoreFactory {
  static create(type: UserStorageType): IUserStorage {
    switch (type) {
      case UserStorageType.Local:
        return new LocalStorageUserStore();
      case UserStorageType.Session:
        return new SessionStorageUserStore();
      default:
        throw new Error(`Unsupported storage type: ${type}`);
    }
  }
}

export {UserStorageType, UserStoreFactory};
