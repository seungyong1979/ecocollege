module.exports = {
  apps: [
    {
      name: 'eco-agenda',
      script: 'node',
      args: '--import tsx/esm src/server.ts',
      cwd: '/home/user/webapp',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        DB_DIR: '/home/user/ecocollege_data'
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}
