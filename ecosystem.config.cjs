const path = require('path')

module.exports = {
  apps: [
    {
      name: 'beef-sync',
      script: path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next'),
      args: 'start -H 0.0.0.0 -p 3020',
      cwd: __dirname,
      env: { NODE_ENV: 'production' },
    },
  ],
}
