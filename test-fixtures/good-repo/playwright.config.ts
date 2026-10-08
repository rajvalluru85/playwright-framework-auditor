export default {
  retries: 2,
  fullyParallel: true,
  reporter: [['html'], ['list']],
  use: { screenshot: 'only-on-failure', video: 'retain-on-failure', trace: 'on-first-retry', actionTimeout: 10000 },
};
