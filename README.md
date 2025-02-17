# sys int

## deps

- nodejs 16+

- redis

## build

```
pnpm i ; npx tsc
```

## config

```ts
interface StaticConfig {
  "server.port": number;
  "server.host": string;
  "wechat.appid": string;
  "wechat.secret": string;
  "session-cache.redis.host": string;
  "session-cache.redis.port": number;
  "session-cache.redis.username"?: string;
  "session-cache.redis.password"?: string;
  "session-cache.redis.db": number;
  "log.level": "info" | "debug" | "warn" | "error";
  "tencent-cloud.secret-id": string;
  "tencent-cloud.secret-key": string;
  "tencent-cloud.region": string;
  "tencent-cloud.bucket": string;
  "amap.jscode": string;
}
```

## run

```bash
node dist/index.mjs
```
