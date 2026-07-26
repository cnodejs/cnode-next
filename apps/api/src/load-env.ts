import { config } from "dotenv";
import { resolve } from "path";
import { setGlobalDispatcher, ProxyAgent } from "undici";

config({ path: resolve(process.cwd(), "../../.env") });
config({ path: resolve(process.cwd(), "../../.env.local"), override: true });

const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
if (proxy) {
  setGlobalDispatcher(new ProxyAgent(proxy));
  console.log("[proxy] set global dispatcher:", proxy);
}
