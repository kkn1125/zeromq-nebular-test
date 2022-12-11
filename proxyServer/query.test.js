const config = require("./nebula.conf");
const NEBULA = require("@nebula-contrib/nebula-nodejs");
const client = NEBULA.createClient(config);

describe("create test suite", () => {
  test("create channel", async () => {
    const channels = await client.execute(
      `MATCH (v:channels) RETURN v AS channels`
    );
    console.log(channels);
    expect(1+1).toBe(2);
  }, 60000);
});
