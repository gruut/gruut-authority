module.exports = {
  apps: [{
    name: 'gruut-authority',
    script: 'app.js',
    instances: 1,
    env: {
      NODE_ENV: 'production',
    },
  }],
};
