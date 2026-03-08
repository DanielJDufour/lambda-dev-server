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

const postForm = (options, payload) =>
  new Promise((resolve, reject) => {
    const postOptions = {
      ...options,
      method: "POST",
      headers: {
        ...options.headers,
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(payload)
      }
    };

    let data = "";
    let headers;

    const req = http.request(postOptions, res => {
      headers = res.headers;
      res.on("data", chunk => (data += chunk));
      res.on("end", () => resolve({ data, headers }));
    });

    req.on("error", reject);
    req.write(payload);
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

test("env with relative env path", async ({ eq }) => {
  console.log(process.cwd());
  const { port } = serve({
    cors: true,
    debug: false,
    env: "./test-function/.env.test",
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

test("env with absolute env path", async ({ eq }) => {
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

test("application/x-www-form-urlencoded", async ({ eq }) => {
  const { port } = serve({
    cors: true,
    debug: false,
    handler: process.cwd() + "/test-function/parse-form.js",
    max: 1
  });
  const options = {
    hostname: "localhost",
    port,
    path: "/"
  };
  const payload = "name=lambda%2Ddev%2Dserver&key=value";
  const { data } = await postForm(options, payload);
  eq(JSON.parse(data), { name: ["lambda-dev-server"], key: ["value"] });
});
