
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
        browser.browserAction.setIcon({path: "icon.png"});
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

async function checkDomain(domain,status) {
    const preHSTS = await primaryTest(domain);
    const preHTTP = await secondaryTest(domain);
    let https;
    if (status!=null){
      https = status;
    } else {
      https = await checkHttpsLoad(domain);
    }
    console.log(`Https res was ${https},preHSTS was ${preHSTS}, preHTTP was ${preHTTP}`)
    if (https != "HTTP"){
      // const HSTS = await hasHSTS(domain)
      if (https =="HSTS"){
        
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
let probe = "probe";
let timing = false;
let start = 0;
let end = 0;

browser.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (probe == "probe" || probe==="control"){
      return;
    }
    return new Promise(async (resolve) => {
      if (details.type === 'main_frame') {
        
        let status;
        for (var header of details.responseHeaders) {
          if (header.name.toLowerCase() == 'strict-transport-security') {
            status = 'HSTS';
           } //else{
          //   browser.webRequest.getSecurityInfo(details.requestId, {})
          //     .then(securityInfo => {
          //       status = securityInfo;
          //     });
          // }
        } 
        console.log(details.url)
        if (!status && details.url.startsWith('https:')) {
          status = 'HTTPS';
        } else if (details.url.startsWith('http:')) {
          status = 'HTTP';
        }
        const newDomain = getHostname(details.url);
        if (newDomain !== currentDomain) {
          curUrl = details.url
          currentDomain = newDomain;
          // redirect to holding page immediately
          resolve({redirectUrl: browser.runtime.getURL("holding-page.html")});
          let res = await checkDomain(currentDomain,status);
          console.log("result is: "+res);
          // based on the result, update the tab to go to the appropriate page
          if (res === "HSTS" || res === "HTTPS" || res === "HTTP" )  {
            browser.tabs.update(details.tabId, {url: details.url});
            if (res=="HTTP"){
              reportHTTP(currentDomain);
            } else {
              reportHSTS(currentDomain);
            }
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
  ['blocking','responseHeaders']
);

browser.webRequest.onBeforeRequest.addListener(
  (details) => {
    // if (details.type === 'main_frame' && getHostname(details.url) != currentDomain){
    //   console.log("ping")
    //   requestStartTimes[getHostname(details.url)] = Date.now();
    // }
    if(probe==="silent" || probe==="control"){
      return
    }
    return new Promise(async (resolve) => {
      if (details.type === 'main_frame') {
        const newDomain = getHostname(details.url);
        if (newDomain !== currentDomain) {
          curUrl = details.url
          currentDomain = newDomain;
          // redirect to holding page immediately
          resolve({redirectUrl: browser.runtime.getURL("holding-page.html")});
          let res = await checkDomain(currentDomain,null);
          console.log("result is: "+res);
          // based on the result, update the tab to go to the appropriate page
          if (res === "HSTS" || res === "HTTPS" || res === "HTTP" )  {
            browser.tabs.update(details.tabId, {url: details.url});
            if (res=="HTTP"){
              reportHTTP(currentDomain);
            } else {
              reportHSTS(currentDomain);
            }
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
  } else if (message.command =="probe"){
    probe = "probe";
    console.log("Switched")
  } else if (message.command == "silent"){
    probe = "silent";
  } else if (message.command =="off"){
    probe = "control";
  } else if (message.command == "save"){
    saveToCSV();
  }
});





  // BloomFilter
const cryptoSubtle = window.crypto.subtle;
// var Long = require('long');
class MurmurHash3 {
  constructor() {
      this.seed1 = 0;
      this.seed2 = 12345678;  // An arbitrary number, can be changed
  }

  update(data) {
      this.data = data;
      return this;
  }

  digest() {
      let hash1,hash2,data;
      data = this._hashWithSeed(this.data, this.seed1);
      hash1 = data[0]
      data = this._hashWithSeed(this.data, this.seed2);
      hash2 = data[0]
      return (BigInt(hash1) << 32n) | BigInt(hash2);
  }

  reset() {
      this.data = '';
  }

  _hashWithSeed(data, seed) {
      let h = seed;
      const c1 = 0xcc9e2d51;
      const c2 = 0x1b873593;
      const r1 = 15;
      const r2 = 13;
      const m = 5;
      const n = 0xe6546b64;

      for(let i = 0; i < data.length; i++) {
          let k = data.charCodeAt(i);
          k *= c1;
          k = (k << r1) | (k >>> (32 - r1));
          k *= c2;

          h ^= k;
          h = (h << r2) | (h >>> (32 - r2));
          h = h * m + n;
      }

      h ^= data.length;
      h ^= h >>> 16;
      h *= 0x85ebca6b;
      h ^= h >>> 13;
      h *= 0xc2b2ae35;
      h ^= h >>> 16;
      
      return [h & 0xffffffff,h];
  }
}


class BloomFilter {
constructor(filterSize, numHashes) {
    this.data = Array(filterSize).fill(0);
    this.hash = new MurmurHash3();
    this.filterSize = filterSize;
    this.numHashes = numHashes;
    this.count = 0;
}

add(data, p, q) {
    let [lower, upper] = this.hashKernel(data);
    console.log(lower,upper)
    let adq = q * 4294967295.0;
    let adp = p * 4294967295.0;
    let newData = Array(this.filterSize).fill(0);

    for(let i = 0; i < this.numHashes; i++) {
        let trueBit = (lower+upper*i)%this.filterSize;
        newData[trueBit]++;
    }

    let falseBits = 0;
    for(let i = 0; i < this.filterSize; i++) {
        let r = Math.floor(Math.random()* 4294967295.0);
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
    let upper = Number(BigInt(sum) & 0xffffffffn);
    let lower = Number((BigInt(sum) >> 32n) & 0xffffffffn);

    return [upper, lower];
}
}

// For use when timing:
// Function to save data to CSV from storage
let requestStartTimes = {};
let loopCount = 0;
let currentSiteIndex = 0;
let testSites = ["https://OlliBrew2.pythonanywhere.com","https://OlliBrew.pythonanywhere.com"]
// For timing usage
// browser.webRequest.onCompleted.addListener(
//  async (details) =>
//     {
//       console.log("pong")
//       if (details.type !== "main_frame"){
//        return; 
//       }
//       let startTime = requestStartTimes[getHostname(details.url)];
//     if (startTime) {
//       let elapsedTime = Date.now() - startTime;
//       let mode = probe === true ? "probe" : probe === false ? "silent" : "control";
//       console.log("time was: "+elapsedTime)
//       storeData(elapsedTime, mode);
//       await onTimingCompleted();
//       delete requestStartTimes[getHostname(details.url)];  // Clear recorded start time
//     }
//   },
//     {urls: ["<all_urls>"]} 
//   )
// function saveToCSV() {
//   browser.storage.local.get("requestData", function(data) {
//     let csvContent = "data:text/csv;charset=utf-8,ElapsedTime,Mode\n";
    
//     if (data.requestData && data.requestData.length > 0) {
//       data.requestData.forEach(item => {
//         csvContent += `${item.elapsedTime},${item.mode}\n`;
//       });

//             // Create a blob from your CSV data:
//       let blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

//       // Convert the blob to an Object URL:
//       let url = URL.createObjectURL(blob);

//       // Download the Object URL:
//       browser.downloads.download({
//           url: url,
//           filename: 'data.csv'
//       });

//       // Revoke the Object URL after the download to free up resources:
//       browser.downloads.onChanged.addListener((delta) => {
//           if(delta.state && delta.state.current === "complete") {
//               URL.revokeObjectURL(url);
//           }
//       });

//       browser.storage.local.remove("requestData");  // Clear stored data after saving
//     }
//   });
// }

// function storeData(elapsedTime, mode) {
//   browser.storage.local.get("requestData", function(data) {
//     let requestData = data.requestData || [];
//     requestData.push({ elapsedTime: elapsedTime, mode: mode });
//     browser.storage.local.set({ requestData: requestData });
//   });
// }
// async function onTimingCompleted() {
//   loopCount++;
//   console.log("------Loop count is: "+loopCount+" mode is: "+probe)
//   // If we've looped 100 times, update mode and reset counter
//   if (loopCount >= 50) {
//       console.log("100")
//       if (probe === 'probe') {
//           probe = "silent";
//       } else if (probe === 'silent') {
//           probe="control";
//       } else if (probe === 'control') {
//           // If you have anything to do when all tests are finished, do it here
//           saveToCSV();
//           return; // end the process
//       }
//       loopCount = 0;
//   }
//   console.log("hello?")

//   // Move to the next site and open in a new tab
//   currentSiteIndex = (currentSiteIndex + 1) % testSites.length;
//   browser.tabs.update({ url: testSites[currentSiteIndex] });
// }