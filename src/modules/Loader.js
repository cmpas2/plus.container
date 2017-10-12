const Container = require('./Container');

// Loader
const Loader = function (options) {
  this.dir = '.';
  this.env = 'dev';
  this.name = 'container';
  this.services = {};

  this.container = new Container();

  Container.extend(this, options || {});

  if (!Container.isArray(this.dir)) this.dir = [this.dir];
};

Container.extend(Loader.prototype, {
  configure: function (name) {
    const fs = require('fs');

    Container.each(this.dir, function (dir) {
      const path = dir + '/' + name;

      if (fs.existsSync(path) && Container.isFunction(require(path))) {
        require(path)(this.container);
      }
    }.bind(this));
  },
  registerServices: function () {
    for (let name in this.services) {
      this.container.register(name, this.services[name]);
    }
  },
  load: function () {
    this.registerServices();

    this.configure(this.name + '.js');
    this.configure(this.name + '_' + this.env + '.js');

    return this.container;
  }
});

module.exports = Loader;
