console.log('content script loaded');

function injectModuleScript() {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = chrome.runtime.getURL('inject.js');
    (document.head || document.body || document.documentElement).appendChild(script);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectModuleScript);
} else {
    injectModuleScript();
}
