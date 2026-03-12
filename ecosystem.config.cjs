const path = require('path')

module.exports = {
  apps: [
    {
      name: 'beef-sync',
      script: path.join(__dirname, 'node_modules', '.bin', 'next.cmd'),
      args: 'start -H 0.0.0.0 -p 8081',
      cwd: __dirname,
      env: { NODE_ENV: 'production' },
      interpreter: 'cmd.exe',
      interpreter_args: '/c',
    },
  ],
}
