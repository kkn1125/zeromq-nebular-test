const { dev } = require("../backend/utils/tools");
const client = require("./nebula.db");

const convertQuerySyntax = (value) =>
  isNaN(value) === true ? `"${value}"` : Number(value);

class Query {
  #name = "";
  #type = "";
  #index = false;
  #category = "";
  #query = [];
  client;
  constructor() {
    // this.#type = type;
    // if (type === "TAG") {
    //   this.#category = "VERTEX";
    // } else if (type === "EDGE") {
    //   this.#category = "EDGE";
    // }
    // this.#name = name;
    this.client = client;
  }
  #clearQuery() {
    this.#query = [];
    this.#index = false;
    this.#name = "";
    this.#type = "";
    this.#category = "";
  }
  show(isIndex = false) {
    this.#query.push(`SHOW ${this.#type.toUpperCase()}`);
    if (isIndex) {
      this.#query.push(`INDEXES`);
    }
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
  values(name, values) {
    if (this.#type === "EDGE") {
      const temp = [];
      for (let i = 0; i < name.length; i++) {
        const [nfisrt, nsecond] = name[i];
        const key = `"${nfisrt}"->"${nsecond}"`;
        const value = `(${values[i]
          .map((val) => convertQuerySyntax(val))
          .join(", ")})`;
        temp.push(`${key}:${value}`);
      }
      this.#query.push(`VALUES ${temp.join(", ")}`);
    } else {
      this.#query.push(
        `VALUES "${name}":(${values
          .map((val) => convertQuerySyntax(val))
          .join(", ")})`
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
  async exec(query) {
    if (query) {
      return await this.client.execute(query);
    } else {
      const queries = this.#query.join(" ");
      dev.alias("Exec Query Check").log(queries);
      this.#clearQuery();
      return await this.client.execute(queries);
    }
  }

  // async find() {
  //   await this.client.execute(
  //     `
  //     CREATE ${this.#type} INDEX IF NOT EXISTS ${this.#name}_index ON ${
  //       this.#name
  //     }()
  //     `
  //   );
  //   await this.client.execute(
  //     `
  //     REBUILD ${this.#type} INDEX ${this.#name}_index
  //     `
  //   );

  //   return await this.client.execute(
  //     `LOOKUP ON ${this.#name} YIELD PROPERTIES(${this.#category}) AS ${
  //       this.#name
  //     }`
  //   );
  // }

  async findConnectedNodes(name) {
    return await this.client.execute(
      `
      GET SUBGRAPH 1 STEPS FROM "${name}" YIELD VERTICES AS NODES
      `
    );
  }
}

module.exports = Query;
