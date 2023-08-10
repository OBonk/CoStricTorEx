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

class MurmurHash3 {
    constructor() {
        this.seed = 0;
    }

    update(data) {
        let h = this.seed;
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

        return this;
    }

    digest() {
        return this.seed & 0xffffffff;
    }

    reset() {
        this.seed = 0;
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
        let upper = Number(BigInt(sum) & 0xffffffffn);
        let lower = Number((BigInt(sum) >> 32n) & 0xffffffffn);
  
        return [upper, lower];
    }
  }

const fs = require('fs');

const buf = JSON.parse(fs.readFileSync('primaryBloomFilter.json', 'utf8'), (_, v) => typeof v === 'string' && v.endsWith('n') ? BigInt(v.slice(0, -1)) : v);
let primaryBloomFilter = new BloomFilter(buf.filterSize, buf.numHashes);
primaryBloomFilter.data = buf.data;
primaryBloomFilter.count = buf.count;

const params = JSON.parse(fs.readFileSync('parameters.json'));
const { p, q, numWebsites, ptm, stm } = params;

const hashClasses = [FnvHash, DJB2, MurmurHash3];
const timings = [];

for(let HashClass of hashClasses) {
    primaryBloomFilter.hash = new HashClass();

    const start = Date.now();
    for(let i = 0; i < 1000; i++) {
        primaryBloomFilter.add("testData" + i, p, q);
    }
    for(let i = 0; i < 1000; i++) {
        primaryBloomFilter.test("testData" + i);
    }
    const end = Date.now();
    timings.push({
        hash: HashClass.name,
        time: end - start
    });
}

console.log(timings);