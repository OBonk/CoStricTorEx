function getHostname(url) {
    const urlObj = new URL(url);
    return urlObj.hostname;
}

// P
// TO DO:
// Handling the probabilistic nature of Bloom filters (false positives and false negatives)
// Implementing the noise-adding mechanisms for differential privacy
// Communicating with the server to receive the latest Bloom filters and to submit reports
// Handling the asynchronous nature of web requests in JavaScript
// Ensuring the security and privacy of your users
function checkDomain(domain) {
    // Checking the domain in the primary filters
    let primaryCounts = [bloomFilters[0].query(domain), bloomFilters[1].query(domain)];
  
    // If the domain is not in either of the primary filters, continue as normal
    if (primaryCounts[0] <= 0 && primaryCounts[1] <= 0) {
      console.log("No action required");
      return;
    }
  
    // Attempt to load the webpage via HTTPS
    let httpsLoadSuccessful = attemptHttpsLoad(domain);
  
    // If the page loaded successfully, no further action is required
    if (httpsLoadSuccessful) {
      console.log("HTTPS load successful");
      return;
    }

    // If the HTTPS load was not successful, check the domain in the secondary filters
    let secondaryCounts = [bloomFilters[2].query(domain), bloomFilters[3].query(domain)];

    // If the domain is in either of the secondary filters, we have a false positive
    if (secondaryCounts[0] > 0 || secondaryCounts[1] > 0) {
    console.log("False positive - showing standard HTTPS-only warning");
    return;
    }

    // If the domain is not in the secondary filters, we assume the user is at risk
    console.log("Possible MITM attack - showing custom warning");
}

let currentDomain = null;

browser.webNavigation.onCommitted.addListener((details) => {
    const newDomain = getHostname(details.url);
    if (newDomain !== currentDomain) {
        currentDomain = newDomain;
        alert(`You navigated to a new domain: ${currentDomain}`);
        // TODO: Implement your CoStricTor protocol here
        
        // Check against bloom filters

        // Decision from bloom filters
        // Not in primary, chill dawg
        // If in primary (not secondary), load
        // If in both, warning! HTTPS only

        // Deal with response (assuming this site is in primary and we attempt to load)
        // If we load successfully over HTTPS, your uncle = bob
        // If we do not load over HTTPS check secondary filter if not in there then false +ive, display HTTPS-Only warning?
        // If the domain in primary but we do not over HTTPS, this is sus mitm warning?

        // Report: In the background, if the we accessed a domain that has HSTS enabled or does not support HTTPS,
        // create a report. The report is sent back to central server to be added to the Bloom filter for the current epoch.
    }
});
browser.webRequest.onBeforeRequest.addListener(
    (details) => {
      console.log('Intercepted request to:', details.url);
      // Here we will check out those sweet responses
    },
    {urls: ['<all_urls>']},  
    ['blocking'] 
  );
  