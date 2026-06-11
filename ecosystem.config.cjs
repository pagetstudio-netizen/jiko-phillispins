module.exports = {
  apps: [
    {
      name: "eiffage",
      script: "dist/index.cjs",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      max_memory_restart: "500M",
      restart_delay: 3000,
      max_restarts: 10,
      watch: false,
      error_file: "logs/err.log",
      out_file: "logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
