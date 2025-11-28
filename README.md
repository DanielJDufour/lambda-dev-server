# lambda-dev-server
> Run Lambda Functions on your Machine

# features
- no third-party dependencies
- configure through CLI or environmental variables
- automatically uses most recent version of handler
- gracefully handler errors

# install
```bash
npm install lambda-dev-server
```

# usage
## in JavaScript
```js
const { serve } = require("lambda-dev-server");

const { port } = serve({
  // you can also directly pass in the handler function
  handler: "./test-function/handler.js",

  cors: true, // enable cross-origin resource sharing
  debug: true,
  env: { AWS_REGION: "us-east-1" }, // environment object or absolute path to .env file
  max: 100, // maximum number of function requests served
  port: 8888,

  // optional
  // default is true
  // if unset or set to true, it will load the most recent version of the handler
  // on each request clearing any in-memory cache
  reload: false,

  root: "./project"
});
```

## in terminal
```sh
lambda-dev-server --cors=true --debug=true --env=.env --handler=./dist/index.js --max=99 --port=8888 --reload=false --root=$PWD/project
```

## invoking lambda function
Simply go to your favorite web browser and navigate to localhost:8080 (or localhost:{port}).
Refreshing the page will re-load and re-run the lambda function.
