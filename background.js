function getHostname(url) {
    const urlObj = new URL(url);
    return urlObj.hostname;
}

let currentDomain = null;

browser.webNavigation.onCommitted.addListener((details) => {
    const newDomain = getHostname(details.url);
    if (newDomain !== currentDomain) {
        currentDomain = newDomain;
        alert(`You navigated to a new domain: ${currentDomain}`);
        // TODO: Implement your CoStricTor protocol here
    }
});

browser.webRequest.onBeforeRequest.addListener(
    (details) => {
      console.log('Intercepted request to:', details.url);
      // Here, you can add your own logic to modify the request, if needed.
      // For example, you could change the URL:
      // return {redirectUrl: 'https://www.example.com'};
    },
    {urls: ['<all_urls>']},  // This will match all HTTP(S) URLs.
    ['blocking']  // This option makes the listener blocking, which means it can modify the request.
  );
  