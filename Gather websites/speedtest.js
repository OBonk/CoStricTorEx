class DJB2 {
    constructor() {
        this.hash = 5381;
    }

    update(data) {
        for(let i = 0; i < data.length; i++) {
            this.hash = (this.hash * 33) ^ data.charCodeAt(i);
        }
        return this;
    }

    digest() {
        return this.hash & 0xffffffff;
    }

    reset() {
        this.hash = 5381;
    }
}

class CityHash {
    constructor() {
        this.hash = 0;
    }

    update(data) {
        let len = data.length;
        for(let i = 0; i < len; i++) {
            let code = data.charCodeAt(i);
            this.hash = BigInt(this.hash)^BigInt(code);
            this.hash = BigInt(this.hash) * 0x9ddfea08eb382d69n;
            this.hash ^= this.hash >> 33n;
            this.hash *= 0xc4ceb9fe1a85ec53n;
            this.hash ^= this.hash >> 33n;
        }
        return this;
    }

    digest() {
        return this.hash & 0xffffffffffffffffn;
    }

    reset() {
        this.hash = 0;
    }
}

class SpookyHash {
    constructor() {
        this.hash1 = 0x6a09e667n;
        this.hash2 = 0xbb67ae85n;
    }

    update(data) {
        let len = data.length;
        for(let i = 0; i < len; i++) {
            let code = data.charCodeAt(i);
            this.hash1 = (this.hash1 + BigInt(code)) * 0x9e3779b1n;
            this.hash2 ^= this.hash1;
        }
        return this;
    }

    digest() {
        return (this.hash1 ^ (this.hash2 << 32n)) & 0xffffffffffffffffn;
    }

    reset() {
        this.hash1 = 0x6a09e667n;
        this.hash2 = 0xbb67ae85n;
    }
}


class MurmurHash3 {
    constructor() {
        this.seed11 = 0;
        this.seed2 = 12345678;  // An arbitrary number, can be changed
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
        
        return [h & 0xffffffff,h];
    }
    }
    


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
            let r = Math.floor(Math.floor(Math.random()* 4294967295.0)* 4294967295.0);
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

  function test(domain, bloomFilter, thresholdMod) {
    let count = bloomFilter.test(domain);
    let numInsertions = bloomFilter.count;
    let adjustedCount = (count - p * numInsertions)/(q-p);
    let threshold = (numInsertions/numWebsites) * thresholdMod;
    return adjustedCount >= threshold;
}
const fs = require("fs")
// Load HSTS websites
const hstsWebsites = fs.readFileSync('hsts_enabled.txt', 'utf8').split('\n').filter(website => website.trim() !== '');

function getRandomWebsite() {
    return hstsWebsites[Math.floor(Math.random() * hstsWebsites.length)];
}

const buf = JSON.parse(fs.readFileSync('primaryBloomFilter.json', 'utf8'), (_, v) => typeof v === 'string' && v.endsWith('n') ? BigInt(v.slice(0, -1)) : v);
let primaryBloomFilter = new BloomFilter(buf.filterSize, buf.numHashes);

const params = JSON.parse(fs.readFileSync('parameters.json'));
const { p, q, numWebsites, ptm, stm } = params;

const hashClasses = [CityHash, FnvHash, DJB2, MurmurHash3,SpookyHash];
const timings = [];

for(let HashClass of hashClasses) {
    primaryBloomFilter.hash = new HashClass();
    process.stdout.write("Running "+HashClass.name+" ");
    const results = {
        time: [],
        min_inserts: [],
        total_pos: []
    };

    for(let run = 0; run < 20; run++) {
        process.stdout.write(".");
        primaryBloomFilter.data = Array(buf.filterSize).fill(0);// Reset data
        primaryBloomFilter.count = buf.count; // Reset count

        // Populate the Bloom filter with 10,000 random websites
        for(let i = 0; i < 10000; i++) {
            primaryBloomFilter.add(getRandomWebsite(), p, q);
        }

        let ret = [];
        const start = Date.now();
        for(let i = 0; i < 10000; i++) {
            primaryBloomFilter.add("testData", p, q);
            
        }
        for(let i=0; i<10000;i++){
            if (test("testData", primaryBloomFilter, ptm)) {
                ret.push(i);
            }
            
        }
        const end = Date.now();
        results.time.push(end - start);
        results.min_inserts.push(ret[0] || null);
    }
    console.log("\n")
    timings.push({  
        hash: HashClass.name,
        avgTime: results.time.reduce((a, b) => a + b, 0) / 20,
        avgMinInserts: results.min_inserts.filter(v => v !== null).reduce((a, b) => a + b, 0) / results.min_inserts.length,
        avgTotalPos: results.total_pos.reduce((a, b) => a + b, 0) / 20
    });
}

console.log(timings);