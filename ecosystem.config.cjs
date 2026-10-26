module.exports = {
  apps: [
    {
      name: 'si-nahkoda',
      script: 'node_modules/tsx/dist/cli.mjs',
      args: 'server.ts',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
