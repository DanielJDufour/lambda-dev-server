const http = require("node:http");
const test = require("flug");
const { serve } = require("./lambda-dev-server");

const get = options =>
  new Promise((resolve, reject) => {
    let data = "";
    let headers;
    const req = http.request(options, res => {
      headers = res.headers;
      res.on("data", chunk => (data += chunk));
      res.on("end", () => resolve({ data, headers }));
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
  const { data } = await get({
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
  const { data } = await get({
    hostname: "localhost",
    port,
    path: "/?name=Daniel",
    method: "GET"
  });
  eq(data, "hello, Daniel");
});

test("internal error capture", async ({ eq }) => {
  const { port } = serve({
    debug: false,
    handler: "./test-function/internal-error.js",
    max: 1
  });
  const { data } = await get({
    hostname: "localhost",
    port,
    path: "/",
    method: "GET"
  });
  eq(data.startsWith("Error: uh oh"), true);
});

test("no-reload", async ({ eq }) => {
  const numRequests = 10;
  const { port } = serve({
    debug: false,
    handler: "./test-function/request-counter.js",
    max: numRequests,
    reload: false
  });
  for (let i = 0; i < numRequests; i++) {
    const { data } = await get({
      hostname: "localhost",
      port,
      path: "/",
      method: "GET"
    });
    eq(data, (i + 1).toString());
  }
});

test("reload", async ({ eq }) => {
  const numRequests = 10;
  const { port } = serve({
    debug: false,
    handler: "./test-function/request-counter.js",
    max: numRequests
  });
  for (let i = 0; i < numRequests; i++) {
    const { data } = await get({
      hostname: "localhost",
      port,
      path: "/",
      method: "GET"
    });
    eq(data, "1");
  }
});

test("handler is function", async ({ eq }) => {
  const { port } = serve({
    debug: false,
    handler: () => ({
      body: "hello",
      headers: {
        "Content-Type": "text/plain"
      }
    }),
    max: 1
  });
  const { data } = await get({
    hostname: "localhost",
    port,
    path: "/",
    method: "GET"
  });
  eq(data, "hello");
});

test("cors", async ({ eq }) => {
  const { port } = serve({
    cors: true,
    debug: false,
    handler: () => ({
      body: "hello",
      headers: {
        "Content-Type": "text/plain"
      }
    }),
    max: 1
  });
  const { headers } = await get({
    hostname: "localhost",
    port,
    path: "/",
    method: "GET"
  });
  eq(headers["access-control-allow-origin"], "*");
});

test("env", async ({ eq }) => {
  console.log(process.cwd());
  const { port } = serve({
    cors: true,
    debug: false,
    env: process.cwd() + "/test-function/.env.test",
    handler: process.cwd() + "/test-function/return-aws-region.js",
    max: 1
  });
  const { data } = await get({
    hostname: "localhost",
    port,
    path: "/",
    method: "GET"
  });
  eq(data, "us-east-1");
});
