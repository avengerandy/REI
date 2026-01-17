import {Item, User} from '../core/entities';
import {PositiveThompsonReranker} from '../core/reranker';
import {UserStoreFactory, UserStorageType} from '../core/storage';

// --- Main Inject Script ---
void (async () => {
  const store = UserStoreFactory.create(UserStorageType.Local);
  const user = (await store.load()) ?? new User();
  user.setMaxHistorySize(100);

  const pathname = window.location.pathname;
  const tagRegex = /\/tags\/(.*)\/(artworks|illustrations)/;
  if (tagRegex.test(pathname)) {
    const result = tagRegex.exec(pathname);
    if (Array.isArray(result)) {
      const item = new Item(self.crypto.randomUUID());
      item.setType(decodeURI(result[1]));
      user.recordClick(item);
      await store.save(user);
    }
    return;
  }

  const tags = new Set<string>();
  const items = [];
  for (const item of user.getClickHistory()) {
    const tag = String(item.getType());
    if (!tags.has(tag)) {
      tags.add(tag);
      items.push(item);
    }
  }

  const reranker = new PositiveThompsonReranker();
  const reranked = await reranker.rank(user, items);

  const container = document.createElement('div');
  container.id = 'rei_div';
  container.style.position = 'fixed';
  container.style.right = '36px';
  container.style.bottom = '36px';
  container.style.background = 'rgba(0, 0, 0, 0.8)';
  container.style.color = '#fff';
  container.style.padding = '12px';
  container.style.borderRadius = '8px';
  container.style.zIndex = '99';
  container.style.fontSize = '36px';

  const ul = document.createElement('ul');
  ul.style.listStyle = 'none';
  ul.style.margin = '0';
  ul.style.padding = '0';

  for (const item of reranked.slice(0, 10)) {
    const li = document.createElement('li');
    li.style.marginBottom = '30px';
    li.style.marginTop = '30px';

    const a = document.createElement('a');
    const tag = String(item.getType());
    a.textContent = tag;
    a.href = `/tags/${tag}/illustrations/`;
    a.target = '_blank';
    li.appendChild(a);
    ul.appendChild(li);
  }

  container.appendChild(ul);
  document.body.appendChild(container);

  console.log('Pixiv inject initialized');
})();
