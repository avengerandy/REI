function injectModuleScript(scriptPath: string) {
  const script = document.createElement('script');
  script.type = 'module';
  script.src = chrome.runtime.getURL(scriptPath);
  (document.head || document.body || document.documentElement).appendChild(
    script,
  );
}

function loadModuleScript(scriptPath: string) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () =>
      injectModuleScript(scriptPath),
    );
  } else {
    injectModuleScript(scriptPath);
  }
}

const {host, pathname} = window.location;

if (host === 'www.books.com.tw' && pathname === '/web/sys_tdrntb/books/') {
  loadModuleScript('dist/books.js');
} else if (host === 'www.tenlong.com.tw' && pathname === '/') {
  loadModuleScript('dist/tenlong.js');
}
