// ============================================================
//  PM2 — Mipangilio ya Kuendesha SaidZen WiFi Daima
//
//  PM2 huiweka tovuti hai: ikianguka inaanzishwa upya moja kwa moja,
//  na inaendelea kufanya kazi hata baada ya kufunga SSH.
//
//  Matumizi:
//    pm2 start ecosystem.config.js
//    pm2 logs saidzen
//    pm2 restart saidzen
//    pm2 stop saidzen
// ============================================================
module.exports = {
  apps: [
    {
      name: "saidzen",
      script: "npm",
      args: "start",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "./logs/saidzen-error.log",
      out_file: "./logs/saidzen-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
