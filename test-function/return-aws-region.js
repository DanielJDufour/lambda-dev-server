exports.handler = async function (event, context) {
  return {
    statusCode: 200,
    isBase64Encoded: false,
    headers: {
      "Content-Type": "text/plain"
    },
    body: process.env.AWS_REGION
  };
}