
// Declare the primary and secondary Bloom filter variables
let primaryBloomFilter = null;
let secondaryBloomFilter = null;
// define your values for p, q, numWebsites, primaryThresholdModifier, and secondaryThresholdModifier, check speed of adding 
let p
let q
let numWebsites
let primaryThresholdModifier
let secondaryThresholdModifier


function convertStringToBigIntObj(obj) {
  let newObj = {};
  for (let key in obj) {
    if (typeof obj[key] === 'string' && obj[key].endsWith('n')) {
      newObj[key] = BigInt(obj[key].slice(0, -1)); // Convert string back to BigInt
    } else {
      newObj[key] = obj[key];
    }
  }
  return newObj;
}

console.log("background script loaded")
async function fetchBloomFilters() {
    try {
        // Fetch parameters
        let response = await fetch('https://costrictor-directory.obonk.repl.co/parameters');
        if (response.ok) { // if HTTP-status is 200-299
            // get the response body
            let json = await response.json();
            p = json.p;
            q = json.q;
            numWebsites = json.numWebsites;
            primaryThresholdModifier = json.primaryThresholdModifier
            secondaryThresholdModifier = json.secondaryThresholdModifier
        } else {
            
            console.error('HTTP-Error: ' + response.status);
        }
        // Fetch the primary Bloom filter
        response = await fetch('https://costrictor-directory.obonk.repl.co/primaryBloomFilter');
        if (response.ok) {
          let json = await response.json();
          json.bloomFilter = JSON.parse(json.bloomFilter);
          console.log(json)
          primaryBloomFilter = new BloomFilter(json.bloomFilter.filterSize, json.bloomFilter.numHashes);
          primaryBloomFilter.data = json.bloomFilter.data;
          primaryBloomFilter.count = json.bloomFilter.count; // Convert string back to BigInt
        } else {
          console.error('HTTP-Error: ' + response.status);
        }

        // Fetch the secondary Bloom filter
        response = await fetch('https://costrictor-directory.obonk.repl.co/secondaryBloomFilter');
        if (response.ok) {
          let json = await response.json();
          json.bloomFilter = JSON.parse(json.bloomFilter);
          secondaryBloomFilter= new BloomFilter(json.bloomFilter.filterSize, json.bloomFilter.numHashes);
          secondaryBloomFilter.data = json.bloomFilter.data;
          secondaryBloomFilter.count = json.bloomFilter.count;// Convert string back to BigInt
        } else {
          console.error('HTTP-Error: ' + response.status);
        }


    } catch (error) {
        console.error('Error fetching Bloom filters:', error);
        if (primaryBloomFilter&&secondaryBloomFilter){
          browser.browserAction.setIcon({path: "iconFS.png"});
          browser.browserAction.setTitle({title: "Failed to sync new bloomfilter with server"});
        } else {
          browser.browserAction.setIcon({path: "iconF.png"});
          browser.browserAction.setTitle({title: "Failed to sync with server new identity required"});
        }
    }
}

// Call fetchBloomFilters every 2 hours
setInterval(fetchBloomFilters, 2 *60 *60 * 1000);


async function primaryTest(domain) {
    let res = await test(domain, primaryBloomFilter, primaryThresholdModifier);
    return res;
}

async function secondaryTest(domain) {
  let res = await test(domain, secondaryBloomFilter, secondaryThresholdModifier);
  return res;
}

async function test(domain, bloomFilter, thresholdMod) {
    let count = await bloomFilter.test(domain);
    let numInsertions = bloomFilter.count;
    console.log(`Q:${q},P:${p},Inserts:${numInsertions},count:${count}`)
    let adjustedCount = (count - p * numInsertions)/(q-p);
    let threshold = (numInsertions/numWebsites) * thresholdMod;
    console.log(`testing adjusted ${adjustedCount},${threshold},bloom count${numInsertions}, thresholdMod ${thresholdMod}`)
    return adjustedCount >= threshold;
}

// Run the fetch function once when the extension is loaded to initialize the filters
fetchBloomFilters();
function getHostname(url) {
    const urlObj = new URL(url);
    let hostn =  urlObj.hostname;
    if (hostn.includes('www.')) {
      // Remove "www." from the input string using the replace() method
      return hostn.replace('www.', '');
    }else{
      return hostn
    }
}


async function checkHttpsLoad(url) {
  // Create HTTPS version of the URL
  let httpsUrl = "https://www."+url;

  // Try to fetch the HTTPS URL
  try {
    const response = await fetch(httpsUrl, {
        method: 'HEAD',
        // redirect: 'follow',
    });
    // Check for HSTS
    if (response.headers.has('Strict-Transport-Security')) {
        return "HSTS"
    } else {
        console.log(response.headers)
        return "HTTPS"
    }
    } catch (error) {
      try{
        const responseHTTP = await fetch('http://' + website, { method: 'HEAD' });
        return "HTTP"
      } catch(errorHTTP) {
        return "HTTP"
      }
    }
}



async function reportHSTS (url){
  try {
    const response = await fetch("https://report-server.obonk.repl.co/report", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // Modify this if sending different data
      },
      body: JSON.stringify({dom:url,type:1}), // Modify this if sending different data
    });

    if (!response.ok) {
      // Handle errors here, e.g., throw an error or log the response status
      throw new Error(`Request failed with status: ${response.status}`);
    }

    // Process the response if needed
    const responseData = await response.json(); // Modify this based on the expected response data format

    // Return the response data if needed
    return responseData;
  } catch (error) {
    // Handle exceptions, e.g., network issues, invalid JSON, etc.
    console.error('Error:', error);
    return null;
  }
}
async function reportHTTP (url){
  try {
    const response = await fetch("https://report-server.obonk.repl.co/report", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // Modify this if sending different data
      },
      body: JSON.stringify({dom:url,type:2}), // Modify this if sending different data
    });

    if (!response.ok) {
      // Handle errors here, e.g., throw an error or log the response status
      throw new Error(`Request failed with status: ${response.status}`);
    }

    // Process the response if needed
    const responseData = await response.json(); // Modify this based on the expected response data format

    // Return the response data if needed
    return responseData;
  } catch (error) {
    // Handle exceptions, e.g., network issues, invalid JSON, etc.
    console.error('Error:', error);
    return null;
  }
}

async function checkDomain(domain) {
    const preHSTS = await primaryTest(domain);
    const preHTTP = await secondaryTest(domain);
    const https = await checkHttpsLoad(domain);
    console.log(`Https res was ${https},preHSTS was ${preHSTS}, preHTTP was ${preHTTP}`)
    if (https != "HTTP"){
      // const HSTS = await hasHSTS(domain)
      if (https =="HSTS"){
        await reportHSTS(domain);
        console.log("HSTS")
        return "HSTS"
      }
      return "HTTPS"
    }else if(preHSTS&&preHTTP){
      console.log("Warning")
      return "Warning"
    }else if(preHSTS&&!preHTTP){
      console.log("MITM")
      return "MITM"
    }else if(preHTTP){
      await reportHTTP(domain)
      console.log("HTTP")
      return "HTTP"
    }else{
      await reportHTTP(domain)
      console.log("HTTP")
      return "HTTP"
    }
  
}



let currentDomain = null;
let waitForLoad = false;
let tabID = null;
let curUrl = null;
browser.webRequest.onBeforeRequest.addListener(
  (details) => {
    return new Promise(async (resolve) => {
      if (details.type === 'main_frame') {
        const newDomain = getHostname(details.url);
        if (newDomain !== currentDomain) {
          curUrl = details.url
          currentDomain = newDomain;
          // redirect to holding page immediately
          resolve({redirectUrl: browser.runtime.getURL("holding-page.html")});
          let res = await checkDomain(currentDomain);
          console.log("result is: "+res);
          // based on the result, update the tab to go to the appropriate page
          if (res === "HSTS" || res === "HTTPS" || res === "HTTP" )  {
            browser.tabs.update(details.tabId, {url: details.url});
          } else if(res==="Warning") {
            tabID = details.tabId
            browser.tabs.update(details.tabId, {url: browser.runtime.getURL("low-warn.html")});
          }else if(res==="MITM") {
            tabID = details.tabId
            browser.tabs.update(details.tabId, {url: browser.runtime.getURL("high-warn.html")});
          }
        } else {
          resolve({}); // continue with the request
        }
      } else {
        resolve({}); // continue with the request
      }
    });
  },
  {urls: ['<all_urls>']},
  ['blocking']
);
browser.runtime.onMessage.addListener((message) => {
  if (message.command === "goBack") {
    // Go back to the previous page
    browser.tabs.update(tabID, {url: "https://www.torproject.org/"});
  } else if (message.command === "proceedUnsafe") {
    // Proceed to the unsafe website
    browser.tabs.update(tabID, {url: curUrl});
  }
});





  // BloomFilter
const cryptoSubtle = window.crypto.subtle;
// var Long = require('long');
class FnvHash {
  constructor() {
      this.hash = 0xcbf29ce484222325n;
  }

  update(data) {
      for(let i = 0; i < data.length; i++) {
          this.hash ^= BigInt(data.charCodeAt(i));
          this.hash *= 0x100000001b3n;
      }

      return this;
  }

  digest() {
      return this.hash & 0xffffffffffffffffn;
  }

  reset() {
      this.hash = 0xcbf29ce484222325n;
  }
}

class BloomFilter {
  constructor(filterSize, numHashes) {
      this.data = Array(filterSize).fill(0);
      this.hash = new FnvHash();
      this.filterSize = filterSize;
      this.numHashes = numHashes;
      this.count = 0;
  }

  add(data, p, q) {
      let [lower, upper] = this.hashKernel(data);
      let adq = q * 4294967295.0;
      let adp = p * 4294967295.0;
      let newData = Array(this.filterSize).fill(0);

      for(let i = 0; i < this.numHashes; i++) {
          let trueBit = (lower+upper*i)%this.filterSize;
          newData[trueBit]++;
      }

      let falseBits = 0;
      for(let i = 0; i < this.filterSize; i++) {
          let r = Math.random();
          if(newData[i] == 1) {
              if(r >= adq) {
                  newData[i] = 0;
              }
          } else {
              if(r < adp) {
                  newData[i] = 1;
                  falseBits++;
              }
          }

          this.data[i] += newData[i];
      }

      this.count++;

      return this;
  }

  test(data) {
      let [lower, upper] = this.hashKernel(data);
      let result = Array(this.numHashes).fill(0);
      for(let i = 0; i < this.numHashes; i++) {
          let trueBit = (lower+upper*i)%this.filterSize;
          result[i] = this.data[trueBit];
      }

      return Math.min(...result);
  }

  hashKernel(data) {
      let sum = this.hash.update(data).digest();
      this.hash.reset();
      let upper = Number(sum & 0xffffffffn);
      let lower = Number((sum >> 32n) & 0xffffffffn);

      return [upper, lower];
  }
}
