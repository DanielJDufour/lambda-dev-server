exports.handler = async function (event, context) {
  const { queryStringParameters } = event;

  const { name="world" } = queryStringParameters

  const body = `hello, ${name}`;

  const headers = {
    "Content-Type": "text/plain"
  };

  return {
    statusCode: 200,
    isBase64Encoded: false,
    headers,
    body
  };
}