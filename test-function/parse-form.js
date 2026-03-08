exports.handler = async (event) => {
  const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf-8')
      : event.body;

  // this is for rawBody in x-www-form-urlencoded format key=value&key2=value2&key=value
  const formParams = new URLSearchParams(rawBody);
  const result = {};

  for (const [key, value] of formParams.entries()) {
      if (!result[key]) result[key] = [];
      result[key].push(value);
  }

  return {
      statusCode: 200,
      isBase64Encoded: false,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(result)
  };
};