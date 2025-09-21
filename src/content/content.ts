function injectModuleScript(scriptPath: string) {
  const script = document.createElement('script');
  script.type = 'module';
  script.src = chrome.runtime.getURL(scriptPath);
  (document.head || document.body || document.documentElement).appendChild(
    script,
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    injectModuleScript('dist/books.js');
  });
} else {
  injectModuleScript('dist/books.js');
}
