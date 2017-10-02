module.exports = [
  {name: 'Test', repo: require('./test')},
  {name: 'TestPost', repo: require('./testPost'), dependencies: ['req']}
];