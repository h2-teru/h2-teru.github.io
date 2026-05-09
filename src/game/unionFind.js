export class UnionFind {
    parent;
    rank;
    constructor(n) {
        this.parent = new Int32Array(n);
        this.rank = new Int8Array(n);
        for (let i = 0; i < n; i++)
            this.parent[i] = i;
    }
    find(x) {
        let cur = x;
        while (this.parent[cur] !== cur) {
            this.parent[cur] = this.parent[this.parent[cur]];
            cur = this.parent[cur];
        }
        return cur;
    }
    union(a, b) {
        const ra = this.find(a);
        const rb = this.find(b);
        if (ra === rb)
            return false;
        if (this.rank[ra] < this.rank[rb])
            this.parent[ra] = rb;
        else if (this.rank[ra] > this.rank[rb])
            this.parent[rb] = ra;
        else {
            this.parent[rb] = ra;
            this.rank[ra]++;
        }
        return true;
    }
}
