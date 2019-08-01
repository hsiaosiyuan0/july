class Runtime {
  static cond(test: any, cons: any[], alt: any) {
    alt = Array.isArray(alt) ? alt : [alt];
    return test ? cons : alt;
  }

  static expand(arr: any[]) {
    let ret: any[] = [];
    for (let i = 0, len = arr.length; i < len; i++) {
      const v = arr[i];
      if (Array.isArray(v)) {
        ret = ret.concat(Runtime.expand(v));
        continue;
      }
      ret.push(v);
    }
    return ret;
  }

  static each(obj: any, kv: boolean, cb: any, empty: any) {
    const ret: any[] = [];
    const o = kv ? Object.entries(obj) : obj;
    if (o.length === 0) return empty;

    if (kv) {
      for (const [k, v] of o) ret.push(cb(k, v));
    } else {
      for (const v of o) ret.push(cb(v));
    }
    return ret;
  }
}

(global as any)["july"] = Runtime;
