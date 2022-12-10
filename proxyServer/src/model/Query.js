const { dev } = require("../../../backend/utils/tools");
const client = require("../../nebula.db");

const convertQuerySyntax = (value) =>
  isNaN(value) === true ? `"${value}"` : Number(value);

class Status {
  locales = {};
  pool_sockets = {};
  pool_publishers = {};
  spaces = {};
  channels = {};
  users = {};

  saveInfo(type, value) {
    this[type].info = value;
  }

  saveTypes(type, value) {
    this[type].vids = value;
  }

  saveVid(type, value) {
    this[type].vid = value;
  }

  getStatus(type) {
    return this[type];
  }
  getInfo(type) {
    return this[type].info;
  }

  getVid(type) {
    if (type === "locales") return this[type].vids;
    return this[type].vid;
  }

  getNextVid(type) {
    if (!this.getVid(type)) {
      const index = type.match(/s$/).index || type.length;
      const vid = type.slice(0, index);
      return vid + (Number(this.getInfo(type).count[0]) + 1);
    }
    return this.getVid(type);
  }
}

class Query extends Status {
  #clause = false;
  #flag = "e";
  #matches = { first: "", middle: "", last: "" };
  // #bridge = false;
  #type = "";
  #index = false;
  #category = "";
  #query = [];
  #returns = "";
  client;
  constructor() {
    super();
    this.client = client;
  }
  #clearQuery() {
    this.#clause = false;
    this.#query = [];
    this.#index = false;
    this.#type = "";
    this.#category = "";
    this.#flag = "e";
    this.#returns = "";
    this.#matches.first = "";
    this.#matches.middle = "";
    this.#matches.last = "";
  }
  show(isIndex = false) {
    this.#query.push(`SHOW ${this.#type.toUpperCase()}`);
    if (isIndex) {
      this.#query.push(`INDEXES`);
    }
    return this;
  }
  returns(returns, as) {
    this.#returns = returns;
    this.#clause &&
      this.#query.splice(
        this.#query.length - 2,
        0,
        (this.#returns + ".").repeat(this.#clause ? 2 : 0) +
          this.#query.splice(this.#query.length - 2, 1)[0]
      );
    this.#query.push(
      `RETURN ${
        this.#returns ||
        (this.#type === "TAG" ? this.#matches.first : this.#matches.middle)
      }${as ? ` AS ${as}` : ""}`
    );
    return this;
  }
  countReturns(returns, as) {
    this.#returns = returns;
    this.#clause &&
      this.#query.splice(
        this.#query.length - 2,
        0,
        (this.#returns + ".").repeat(this.#clause ? 2 : 0) +
          this.#query.splice(this.#query.length - 2, 1)[0]
      );
    this.#query.push(
      `RETURN COUNT(${
        this.#returns ||
        (this.#type === "TAG" ? this.#matches.first : this.#matches.middle)
      })${as ? ` AS ${as}` : ""}`
    );
    return this;
  }
  match() {
    if (this.#type === "TAG") this.#flag = "v";
    this.#query.push(`MATCH`);
    return this;
  }
  edge(middle) {
    this.#matches.middle = middle;
    this.#query.push(`-[${middle}:${middle}]->`);
    return this;
  }
  vertex(last) {
    if (!this.#matches.first) this.#matches.first = last;
    if (this.#matches.first) this.#matches.last = last;

    this.#query.push(`(${last ? `${last}:${last}` : ""})`);
    return this;
  }
  where(field, value) {
    this.#clause = true;
    let covered = value;
    if (isNaN(value)) {
      covered = `"${value}"`;
    }
    this.#query.push(`WHERE`);
    this.#query.push(field);
    value && this.#query.push(`==${covered}`);
    return this;
  }
  startsWith(value) {
    this.#clause = true;
    let covered = value;
    if (isNaN(value)) {
      covered = `"${value}"`;
    }
    this.#query.push(`STARTS WITH`);
    this.#query.push(covered);
    return this;
  }
  type(type) {
    this.#type = type;
    this.#category = type.match(/tag/i) ? "VERTEX" : "EDGE";
    return this;
  }
  create() {
    this.#query.push(`CREATE ${this.#type}`);
    return this;
  }
  index() {
    this.#query.push(`INDEX`);
    this.#index = true;
    return this;
  }
  ifNotExists() {
    this.#query.push(`IF NOT EXISTS`);
    return this;
  }
  target(name) {
    this.#query.push(`${name}`);
    if (this.#index) {
      this.#query[this.#query.length - 1] += "_index";
      this.#query.push(`ON ${name}()`);
    }
    return this;
  }
  insert() {
    this.#query.push(`INSERT ${this.#category}`);
    return this;
  }
  delete(tag, target) {
    this.#query.push(`DELETE ${this.#type} ${tag} FROM "${target}"`);
    return this;
  }
  keys(keys) {
    this.#query.push(`(${keys.join(", ")})`);
    return this;
  }
  values(...datas) {
    if (!this.#query.includes("VALUES")) {
      this.#query.push("VALUES");
    }

    if (this.#type === "EDGE") {
      const temp = [];
      const [name, values] = datas;
      for (let i = 0; i < name.length; i++) {
        const [nfisrt, nsecond] = name[i];
        const key = `"${nfisrt}"->"${nsecond}"`;
        const value = `(${values[i]
          .map((val) => convertQuerySyntax(val))
          .join(", ")})`;
        temp.push(`${key}:${value}`);
      }
      this.#query.push(`${temp.join(", ")}`);
    } else {
      this.#query.push(
        datas
          .map(
            ([name, values]) =>
              `"${name}":(${values
                .map((val) => convertQuerySyntax(val))
                .join(", ")})`
          )
          .join(", ")
      );
    }

    return this;
  }
  lookup(name) {
    this.#query.push(`LOOKUP ON ${name}`);
    return this;
  }
  properties(as) {
    this.#query.push(`YIELD PROPERTIES(${this.#category})`);
    if (as) {
      this.#query.push(`AS ${as}`);
    }
    return this;
  }
  rebuild(name) {
    this.#query.push(`REBUILD ${this.#type} INDEX ${name}_index`);
    return this;
  }
  subgraph(name, alias = "NODES") {
    this.#query.push(
      `GET SUBGRAPH 1 STEPS FROM "${name}" YIELD VERTICES AS ${alias}`
    );
    return this;
  }
  async waitExec(query) {
    if (query) {
      return await this.client.execute(query);
    } else {
      const queries = this.#query.join(" ");
      dev.alias("Before Exec Query Check").log(queries);
      this.#query = [];
      return await this.client.execute(queries);
    }
  }
  async exec(query, debug = false) {
    if (query) {
      debug && dev.alias("Instant Exec Query Check").log(query);
      return await this.client.execute(query);
    } else {
      const queries = this.#query.join(" ");
      debug && dev.alias("Exec Query Check").log(queries);
      this.#clearQuery();
      return await this.client.execute(queries);
    }
  }
}

module.exports = Query;
