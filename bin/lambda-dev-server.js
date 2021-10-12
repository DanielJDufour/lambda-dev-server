#!/usr/bin/env node

const fs = require("fs");
const http = require("http");

const DEFAULT_CONTENT_TYPE = "application/json";
const DEFAULT_PORT = 8080;

const TRUES = ["TRUE", "True", "true", true];

function serve({ handler: handlerPath, debug = false, max = Infinity, port, root }) {
  if (debug) console.log("[lds] starting lambda-dev-server (lds)");

  if (typeof handlerPath !== "string" || handlerPath.trim() === "") {
    throw new Error("[lds] handler must be set");
  }

  if (!root) {
    root = process.cwd();
    if (debug) console.log(`[lds] root not set so using current working directory "${root}"`);
  }

  if (max === undefined || max === null) max = Infinity;
  if (debug) console.log(`[lds] serving ${max} requests`);

  if (!port) port = process.env.LDS_DEFAULT_PORT ? process.env.LDS_DEFAULT_PORT : DEFAULT_PORT;
  port = parseInt(port);

  function checkForCloseRequest() {
    if (TRUES.includes(process.env.LDS_PLZ_CLOSE)) {
      server.close();
    }
  }

  let count = 0;

  const server = http.createServer(async function onRequest(request, response) {
    try {
      count++;

      const { url } = request;

      if (debug) console.log(`[lds] received request for "${url}"`);

      if (url.startsWith("/favicon.ico")) return;

      const { pathname, searchParams } = new URL(`http://localhost:${port}` + url);

      if (pathname !== "" && pathname !== "/") {
        const searchParamsAsString = searchParams.toString();
        // redirect to root path
        response.writeHead(302, {
          Location: `http://localhost:${port}${searchParamsAsString.length > 0 ? "?" + searchParamsAsString : ""}`
        });
        response.end();
        if (count >= max) {
          if (debug) console.log("[lds] reached maximum number of requests " + max);
          server.close();
        }
        return;
      }

      const queryStringParameters = Object.fromEntries(searchParams.entries());
      if (debug) {
        console.log("[lds] queryStringParameters:", queryStringParameters);
      }

      const event = { queryStringParameters };
      if (debug) console.log("[lds] event is ", event);

      // reload function on each request
      const { handler } = require(handlerPath);
      if (debug) console.log("[lds] handler:", handler);

      let statusCode, isBase64Encoded, headers, body;
      try {
        const result = await handler(event, {});
        if (!result.body) throw new Error(`handler returned body "${result.body}"`);
        ({ statusCode = 200, isBase64Encoded, headers = {}, body } = result);
        if (debug) console.log(`[lds] status code is "${statusCode}"`);
        if (debug) console.log(`[lds] body is ${isBase64Encoded ? "" : "*not*"} base-64 encoded`);
      } catch (error) {
        console.error("[lds] encountered error while running handler");
        throw error;
      }
      if (!headers["Content-Type"]) {
        if (debug) console.log(`[lds] Content-Type headers not set, so defaulting to "${DEFAULT_CONTENT_TYPE}"`);
        headers["Content-Type"] = DEFAULT_CONTENT_TYPE;
      }
      Object.entries(headers).forEach(([k, v]) => {
        if (debug) console.log(`[lds] setting header "${k}" to "${v}"`);
        response.setHeader(k, v);
      });

      response.writeHead(statusCode);
      if (debug) console.log("[lds] wrote status code to response");

      if (debug) console.log(`[lds] first 100 chars of body: "${body.substr(0, 100)}"`);
      if (debug) console.log("[lds] body.length: " + body.length);
      const encoding = isBase64Encoded ? "base64" : "utf-8";
      if (debug) console.log("[lds] encoding of body:", encoding);
      response.end(body, encoding);
    } catch (error) {
      console.error(error);
      response.setHeader("Content-Type", "text/plain");
      response.writeHead(200);
      response.end(error.stack);
    }
    if (count >= max) {
      if (debug) console.log("[lds] reached maximum number of requests " + max);
      server.close();
    }
  });

  server.listen(port);
  if (debug) console.log(`[lds] listening on port "${port}"`);

  if (debug) console.log(`[lds] server is ready at http://localhost:${port}`);

  return { debug, max, server, port, root };
}

module.exports = { serve };

if (require.main === module) {
  const args = Array.from(process.argv);
  const str = args.join(" ");

  serve({
    debug: !!str.match(/-?-debug((=|== )(true|True|TRUE))?/),
    max: Array.prototype.slice.call(str.match(/-?-max(?:=|== )(\d+)/) || [], 1)[0],
    handler: Array.prototype.slice.call(str.match(/-?-handler(?:=|== )([^ ]+)/) || [], 1)[0],
    port: Array.prototype.slice.call(str.match(/-?-port(?:=|== )(\d+)/) || [], 1)[0],
    root: Array.prototype.slice.call(str.match(/-?-root(?:=|== )([^ ]+)/) || [], 1)[0]
  });
}
