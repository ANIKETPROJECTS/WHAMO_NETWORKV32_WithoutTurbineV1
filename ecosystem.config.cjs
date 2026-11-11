module.exports = {
  apps: [
    {
      name: "whamo-app",
      script: "./dist/index.cjs",
      env: {
        NODE_ENV: "production",
        PORT: 3006,
      }
    }
  ]
};
