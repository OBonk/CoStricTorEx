
// Declare the primary and secondary Bloom filter variables
let primaryBloomFilter = null;
let secondaryBloomFilter = null;
// define your values for p, q, numWebsites, primaryThresholdModifier, and secondaryThresholdModifier, check speed of adding 
let p
let q
let numWebsites
let primaryThresholdModifier
let secondaryThresholdModifier

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

        if (response.ok) { // if HTTP-status is 200-299
            // get the response body
            let json = await response.json();
            primaryBloomFilter = new BloomFilter(json.bloomFilter.filterSize, json.bloomFilter.numHashes);
            primaryBloomFilter.data = json.bloomFilter.data;
            primaryBloomFilter.count = json.bloomFilter.count;
            console.log('Primary Bloom filter updated.');
        } else {
            console.error('HTTP-Error: ' + response.status);
        }

        // Fetch the secondary Bloom filter
        response = await fetch('https://costrictor-directory.obonk.repl.co/secondaryBloomFilter');

        if (response.ok) { // if HTTP-status is 200-299
            // get the response body
            let json = await response.json();
            secondaryBloomFilter= new BloomFilter(json.bloomFilter.filterSize, json.bloomFilter.numHashes);
            secondaryBloomFilter.data = json.bloomFilter.data;
            secondaryBloomFilter.count = json.bloomFilter.count;
            console.log('Secondary Bloom filter updated.');
        } else {
            console.error('HTTP-Error: ' + response.status);
        }

    } catch (error) {
        console.error('Error fetching Bloom filters:', error);
    }
}

// Call fetchBloomFilters every 2 hours
setInterval(fetchBloomFilters, 2 *60 *60 * 1000);


// function reportHsts(domain) {
//     primaryBloomFilter.add(domain, p, q);
// }

// function reportHttp(domain) {
//     secondaryBloomFilter.add(domain, p, q);
// }

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

// P
// TO DO:
// Handling the probabilistic nature of Bloom filters (false positives and false negatives) - DONE
// Implementing the noise-adding mechanisms for differential privacy - DONE
// Communicating with the server to receive the latest Bloom filters and to submit reports - DONE
// Handling the asynchronous nature of web requests in JavaScript - DONE
// Ensuring the security and privacy of your users
// Global Bloom filter variables - DONE

async function checkHttpsLoad(url) {
  // Create HTTPS version of the URL
  let httpsUrl = "https://"+url;

  // Try to fetch the HTTPS URL
  try {
    const response = await fetch(httpsUrl, {
        method: 'HEAD',
        redirect: 'follow',
    });
    // Check for HSTS
    if (response.headers.has('Strict-Transport-Security')) {
        return "HSTS"
    } else {
        return "HTTPS"
    }
    } catch (error) {
      try{
        const responseHTTP = await fetch('http://' + website, { method: 'HEAD' });
        return "HTTP"
      } catch(errorHTTP) {
        return false
      }
    }
}

// async function hasHSTS(url) {
//   try {
//     const response = await fetch(url, { method: 'HEAD' });

//     if (response.headers.has('Strict-Transport-Security')) {
//       return true;
//     } else {
//       return false;
//     }
//   } catch (error) {
//     // If there's an error (e.g., network issue, website not reachable), return false
//     return false;
//   }
// }

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
    // Check the domain in the primary filter
    // let primaryCount = primaryBloomFilter.test(domain);
  
    // If the domain is not in the primary filter, continue as normal
    // if (primaryTest(domain)) {
    //   return true // No action 
    // } else {
    //   const https = checkHttpsLoad(domain)
    //   return https // attempt HTTPS load
    // }
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
    }

}

// function checkHTTPS(domain, res) {
//   // Perform check on res to see if load successful
//   let httpsLoadSuccessful = check(res); // This check function should be defined elsewhere
//   // If the page loaded successfully, no further action is required
//   if (httpsLoadSuccessful) {
//     console.log("HTTPS load successful");
//     return 0;
//   }

//   // If the HTTPS load was not successful, check the domain in the secondary filter
//   // let secondaryCount = secondaryBloomFilter.test(domain);

//   // If the domain is in the secondary filter, we have a false positive
//   if (secondaryTest(domain)) {
//     console.log("False positive - showing standard HTTPS-only warning");
//     return 1;
//   }

//   // If the domain is not in the secondary filter, we assume the user is at risk
//   console.log("Possible MITM attack - showing custom warning");
//   return 2;
// }

let currentDomain = null;
let waitForLoad = false;

// let originalUrl = null;

// browser.webRequest.onBeforeRequest.addListener(
//   (details) => {
//     if (details.type === 'main_frame') {
//       const newDomain = getHostname(details.url);
//       if (newDomain !== currentDomain) {
//         currentDomain = newDomain;
//         originalUrl = details.url; // store the original url
//         // redirect to the holding page
//         return { redirectUrl: browser.extension.getURL('holding.html') };
//       }
//     }
//   },
//   { urls: ['<all_urls>'] },
//   ['blocking']
// );

browser.webRequest.onBeforeRequest.addListener(
  (details) => {
    return new Promise(async (resolve) => {
      if (details.type === 'main_frame') {
        const newDomain = getHostname(details.url);
        if (newDomain !== currentDomain) {
          currentDomain = newDomain;
          let res = await checkDomain(currentDomain);
          console.log("result is: "+res);
          // based on the result, either block or continue with the request
          if (res === "HSTS" ||res === "HTTPS")  {
            resolve({}); // continue with the request
          } else {
            resolve({cancel: true}); // block the request
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





      
      // if (waitForLoad){
      //   console.log('Intercepted request to:', details.url);
      //   if(getHostname(details.url)==currentDomain){
      //     console.log("bingo")
      //   }
      //   if (details.url.startsWith('http://')) {
      //     console.log('Insecure request:', details.url);
      //     // Optionally, you can redirect the request to HTTPS
      //     let redirectUrl = details.url.replace('http://', 'https://');
      //     return {redirectUrl: redirectUrl};
      //   }
      // }
  


// write3 baoput no extresnions

  // BloomFilter
const cryptoSubtle = window.crypto.subtle;
// var Long = require('long');
class BloomFilter {
  constructor(filterSize, numHashes) {
      this.data = Array(filterSize).fill(0);
      this.filterSize = filterSize;
      this.numHashes = numHashes;
      this.count = 0;
  }

  async hashKernel(data) {
      const buffer = new TextEncoder().encode(data);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
      const hashArray = new Uint8Array(hashBuffer);
      const hashNum = Long.fromBytes(hashArray, true);
      const upper = hashNum.and(Long.fromInt(0xffffffff)).toInt();
      const lower = hashNum.shru(32).and(Long.fromInt(0xffffffff)).toInt();
      return [upper, lower];
  }
  async add(data, p, q) {
    const [lower, upper] = await this.hashKernel(data);
    const adq = Math.floor(q * 4294967295.0);
    const adp = Math.floor(p * 4294967295.0);
    const newData = Array(this.filterSize).fill(0);
    let falseBits = 0;

    for (let i = 0; i < this.numHashes; i++) {
        const trueBit = ((lower + upper * i) % this.filterSize);
        newData[trueBit] += 1;
    }

    for (let i = 0; i < this.filterSize; i++) {
        const r = Math.floor(Math.random() * 4294967295.0);
        if (newData[i] === 1) {
            if (r >= adq) {
                newData[i] = 0;
            }
        } else {
            if (r < adp) {
                newData[i] = 1;
                falseBits += 1;
            }
        }
        this.data[i] += newData[i];
    }
    this.count++;

    return this;
    }

    async test(data) {
        const [lower, upper] = await this.hashKernel(data);
        const result = Array(this.numHashes).fill(0);
        let min = 0;

        for (let i = 0; i < this.numHashes; i++) {
            const trueBit = ((lower + upper * i) % this.filterSize);
            result[i] = this.data[trueBit];
        }

        for (let i = 0; i < result.length; i++) {
            if (i === 0 || result[i] < min) {
                min = result[i];
            }
        }

        return min;
    }
}

