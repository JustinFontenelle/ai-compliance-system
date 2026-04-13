const { createClient } = require("redis");

async function test() {
  const client = createClient({
    url: "redis://127.0.0.1:6379"
  });

  await client.connect();

  console.log("Connected to Redis");

  await client.set("test", "hello");

  const value = await client.get("test");

  console.log("Value:", value);

  await client.quit();
}

test();