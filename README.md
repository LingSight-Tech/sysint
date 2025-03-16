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
  "mysql.host": string;
  "mysql.port": number;
  "mysql.user": string;
  "mysql.password": string;
  "mysql.database": string;
  "mysql.connection-limit": number;
  "mysql.wait-for-connections": boolean;
  "mysql.queue-limit": number;
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
