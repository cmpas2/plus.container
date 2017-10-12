const IocContainer = require('../src/Container');
const container = IocContainer.create();

const repositories = require('./repositories');

for (let i of repositories) {
  container.register(i.name, i.repo, i.dependencies || []);
}

// pass whatever base requirements the app has here
module.exports = (config, log) => {
  return container
    .register('config', config)
    .register('log', log);
};
