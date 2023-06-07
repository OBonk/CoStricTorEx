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
  