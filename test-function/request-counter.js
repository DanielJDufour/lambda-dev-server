let count = 0;

exports.handler = async function (event, context) {
  count++;

  const body = (count).toString();

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