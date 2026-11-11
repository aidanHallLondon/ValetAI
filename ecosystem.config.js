module.exports = {
  apps: [
    {
      name: "ui",
      script: "./node_modules/.bin/tsx",
      args: "src/ui/index.ts",
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "development",
        PORT: 3001,
      },
    },
    {
      name: "agent",
      script: "./node_modules/.bin/tsx",
      args: "src/agent/index.ts",
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "development",
        LM_STUDIO_BASE_URL: "http://localhost:1234/v1",
      },
    },
    {
      name: "gatherer",
      script: "./node_modules/.bin/tsx",
      args: "src/gatherer/index.ts",
      cron_restart: "*/15 * * * *",
      autorestart: false,
      watch: ["src/gatherer"],
      env: {
        NODE_ENV: "development",
      },
    },
  ],
};

