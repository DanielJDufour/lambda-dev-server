const http = require("http");
const test = require("flug");
const { serve } = require("./lambda-dev-server");

const get = options =>
  new Promise((resolve, reject) => {
    let data = "";
    const req = http.request(options, res => {
      res.on("data", chunk => (data += chunk));
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.end();
  });

test(`"hello, world"`, async ({ eq }) => {
  const { port } = serve({
    debug: false,
    handler: "./test-function/handler.js",
    max: 1
  });
  const data = await get({
    hostname: "localhost",
    port,
    method: "GET"
  });
  eq(data, "hello, world");
});

test(`"hello, {name}"`, async ({ eq }) => {
  const { port } = serve({
    debug: false,
    handler: "./test-function/handler.js",
    max: 1
  });
  const data = await get({
    hostname: "localhost",
    port,
    path: "/?name=Daniel",
    method: "GET"
  });
  eq(data, "hello, Daniel");
});

test("internal error capture", async ({ eq }) => {
  const { port } = serve({
    debug: true,
    handler: "./test-function/internal-error.js",
    max: 1
  });
  const data = await get({
    hostname: "localhost",
    port,
    path: "/",
    method: "GET"
  });
  eq(data.startsWith("Error: uh oh"), true);
});
