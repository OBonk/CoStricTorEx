const { createHash } = require('crypto');
const { FastRand } = require('fastrand');

class BloomFilter {
  constructor(filterSize, numHashes) {
    this.data = new Array(filterSize).fill(0);
    this.hash = createHash('fnv1a64');
    this.filterSize = filterSize;
    this.numHashes = numHashes;
    this.count = 0;
  }

  add(data, p, q) {
    const [lower, upper] = this.hashKernel(data, this.hash);
    const adq = Math.floor(q * 4294967295);
    const adp = Math.floor(p * 4294967295);
    const newData = new Array(this.filterSize).fill(0);
    for (let i = 0; i < this.numHashes; i++) {
      const trueBit = (lower + upper * i) % this.filterSize;
      newData[trueBit] += 1;
    }
    let falseBits = 0;
    for (let i = 0; i < this.filterSize; i++) {
      const r = FastRand();
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
    if (falseBits > 0) {
      // console.log(falseBits);
    }
    this.count++;
    return this;
  }

  test(data) {
    const [lower, upper] = this.hashKernel(data, this.hash);
    const result = new Array(this.numHashes);
    for (let i = 0; i < this.numHashes; i++) {
      const trueBit = (lower + upper * i) % this.filterSize;
      result[i] = this.data[trueBit];
    }
    let min = 0;
    for (let i = 0; i < result.length; i++) {
      const e = result[i];
      if (i === 0 || e < min) {
        min = e;
      }
    }
    return min;
  }

  hashKernel(data, hash) {
    hash.update(data);
    const sum = hash.digest('hex');
    hash.reset();
    const upper = parseInt(sum.slice(0, 8), 16);
    const lower = parseInt(sum.slice(8, 16), 16);
    return [lower, upper];
  }
}

// Usage example:
const bloomFilter = new BloomFilter(1000, 3);
bloomFilter.add('data1', 0.5, 0.2);
const result = bloomFilter.test('data1');
console.log(result);