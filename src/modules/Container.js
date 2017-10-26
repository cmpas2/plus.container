/* eslint-disable max-lines */

/**
 * 
 */
function Container() {
  this._new();
}

// Util
Container.extend = function (dest, src) {
  for (let i in src) dest[i] = src[i];
};

Container.create = function () {
  return new Container();
};

// class Container
Container.extend(Container.prototype, {

  _new: function () {
    this._resolved = new Container.Hash();
    this._register = new Container.Hash();
    this._dependencies = new Container.Hash();
    this._tags = new Container.Hash();
    this._parentGetter = null;

    this._accesor = new Container.Accessor();
    this._properties = new Container.Hash();
  },
  add: function (name, definition, dependencies) {
    return this.register(name, definition, dependencies);
  },
  provide: function (name, definition, dependencies) {
    if (Container.isFunction(definition)) {
      definition.$injectMap = dependencies || {};
    }

    return this.register(name, definition, ['container']);
  },
  register: function (name, definition, dependencies) {
    // clean up
    this.remove(name);

    this._defineProperty(name);
    if (name !== 'parent') this._defineParentGetter(definition);

    if (Container.isFunction(definition)) {
      this._register.set(name, definition);
      if ( ! dependencies) {
        if (definition.$inject && typeof definition.$inject === 'function' ) {
          dependencies = definition.$inject();
        }
      }
      this._dependencies.set(
        name,
        dependencies || definition.$inject || []
      );
      this._tags.set(name, definition.$tags || []);
    } else {
      this.set(name, definition);
    }

    // to chain
    return this;
  },
  get: function (name) {
    // return self
    if (name == 'container') return this;

    // use accessor
    if (this._accesor.isPath(name)) return this._accesor.get(this, name);

    // if resolved return
    if (this._resolved.has(name)) return this._resolved.get(name);

    // if not registered return null
    if (!this._register.has(name)) {
      // see if this container inherits this from a parent
      if (this._resolved.has('parent')) {
        const parentContainer = this._resolved.get('parent');
        const parentResolved = parentContainer.inherit(name, this);
        if (parentResolved !== null) {
          // store in child class for later access
          this.set(name, parentResolved);
          return parentResolved;
        }
      }
      // see if this container is a parent 
      if (Container.isFunction(this._parentGetter)) {
        return this._parentGetter(name);
      }
      return null;
    }

    // resolve
    this.set(name, this.create(name));

    return this.get(name);
  },
  inherit: function (name, child) {
    // return self
    if (name == 'container') return null;

    // use accessor
    if (this._accesor.isPath(name)) return this._accesor.get(this, name);

    // if resolved return
    if (this._resolved.has(name)) return this._resolved.get(name);

    // if not registered return null
    if (!this._register.has(name)) {
      return null;
    }

    // resolve with child dependencies but dont store in container
    let resolvedWithChildDependencies = this._createChildInjected(name, child);

    return resolvedWithChildDependencies;
  },
  set: function (name, definition) {
    if (this._accesor.isPath(name)) {
      return this._accesor.set(this, name, definition);
    }

    this._resolved.set(name, definition);
  },
  create: function (name) {
    if (!this._register.has(name)) return null;

    // get _class
    const _class = this._register.get(name);

    // null if not a function
    if (!Container.isFunction(_class)) return null;

    if (_class.$injectMap) {
      return this._createMapInjected(name);
    } else {
      return this._createArrayInjected(name);
    }
  },
  remove: function (name) {
    this._register.remove(name);
    this._resolved.remove(name);
    this._dependencies.remove(name);
    this._tags.remove(name);
  },
  find: function (include, exclude) {
    const self = this;

    let result = [];

    this._tags.each(function (tags, name) {
      let found = true;

      Container.each(include || [], function (name) {
        if (tags.indexOf(name) < 0) found = false;
      });

      Container.each(exclude || [], function (name) {
        if (tags.indexOf(name) >= 0) found = false;
      });

      if (found) result.push(self.get(name));
    });

    return result;
  },
  merge: function (container) {
    if (container instanceof Container) {
      this._resolved.merge(container._resolved);
      this._register.merge(container._register);
      this._dependencies.merge(container._dependencies);
      this._tags.merge(container._tags);
    }
  },
  load: function (options) {
    this.merge(Container.load(options));
  },
  _defineProperty: function (name) {
    const container = this;

    const hasSupport = Container.isFunction(Object.defineProperty);
    const isNotDefined = !container._properties.has(name);
    const isNotOwnMethod = !container[name] || true;

    if (hasSupport && isNotDefined && isNotOwnMethod) {
      container._properties.set(name, name);

      Object.defineProperty(container, name, {
        get: function () {
          return container.get(name);
        }
      });
    }
  },
  _getPropertyContainer: function (map) {
    map = map || {};

    const container = this;
    let wrapper = {};

    const bind = function (name) {
      if (Container.isFunction(Object.defineProperty)) {
        Object.defineProperty(wrapper, name, {
          get: function () {
            const mappedName = map[name] || name;
            return container.get(mappedName);
          }
        });
      }
    };

    // @@@ reafactor
    const Hash = Container.Hash;
    const props = (new Hash())
      .merge(new Hash(map))
      .merge(container._properties)
    ;
    props.each(function (value, name) {
      bind(name);
    });

    return wrapper;
  },
  _createMapInjected: function (name) {
    const _class = this._register.get(name);
    const map = _class.$injectMap || {};
    const wrapper = this._getPropertyContainer(map);

    const args = [wrapper];
    // make creator with args
    const creator = Container.makeCreator(_class, args);

    // create
    return creator();
  },
  _createArrayInjected: function (name) {
    // get class
    const _class = this._register.get(name);

    // get names
    const $inject = this._dependencies.has(name)
      ? this._dependencies.get(name)
      : []
    ;

    // args collection
    let args = [];

    // collect args
    for (let i = 0; i < $inject.length; i++) {
      args.push(this.get($inject[i]));
    }

    // make creator with args
    const Creator = Container.makeCreator(_class, args);

    // create
    return new Creator();
  },
  _createChildInjected: function (name, child) {
    // get class
    const _class = this._register.get(name);

    // get names
    const $inject = this._dependencies.has(name)
      ? this._dependencies.get(name)
      : []
    ;

    // args collection
    let args = [];

    // collect args
    for (let i = 0; i < $inject.length; i++) {
      let cInj = child.get($inject[i]);
      args.push(cInj ? cInj : this.get($inject[i]));
    }

    // make creator with args
    const Creator = Container.makeCreator(_class, args);

    // create
    return new Creator();
  },
  _setParent: function (parent) {
    const container = this;

    this._parentGetter = function (name) {
      return parent.get(name);
    };

    parent._properties.each(function (name) {
      container._defineProperty(name);
    });
  },
  _defineParentGetter: function (childContainer) {
    if (Container.isContainer(childContainer)) {
      childContainer._setParent(this);
    }
  }
});

// class Hash
Container.Hash = function (hash) {
  this._new(hash);
};

Container.extend(Container.Hash.prototype, {

  _new: function (hash) {
    this.hash = hash || {};
  },
  get: function (name) {
    return this.has(name) ? this.hash[name] : null;
  },
  set: function (name, value) {
    this.hash[name] = value;
  },
  has: function (name) {
    return name in this.hash;
  },
  remove: function (name) {
    return this.has(name) && delete this.hash[name];
  },
  each: function (fn) {
    for (let i in this.hash) fn(this.hash[i], i);
  },
  keys: function () {
    let keys = [];
    this.each(function (value, key) {
      keys.push(key);
    });
    return keys;
  },
  merge: function (hash) {
    if (hash instanceof Container.Hash) Container.extend(this.hash, hash.hash);
    return this;
  }
});


// Tools
Container.extend(Container, {
  isFunction: function (value) {
    return value instanceof Function;
  },
  isClass: function (value) {
    return typeof value === 'function' && /^\s*class\s+/.test(value.toString());
  },
  isArray: function (value) {
    return Object.prototype.toString.call(value) === '[object Array]';
  },
  isPureObject: function (value) {
    return Container.isObject(value)
      && !Container.isArray(value)
      && !Container.isFunction(value);
  },
  isObject: function (value) {
    return value instanceof Object;
  },
  isContainer: function (value) {
    return value instanceof Container;
  },
  each: function (hash, fn) {
    if (Container.isArray(hash)) {
      for (let i = 0; i < hash.length; i++) fn(hash[i], i);
    } else {
      new Container.Hash(hash).each(fn);
    }
  },
  makeCreator: function (_class, _args) {
    if (Container.isClass(_class)) {
      const bind = function () {
        const a = _args
          .map(function (value, idx) {
            return '_args[' + idx + ']';
          })
          .join(', ');

        return eval('new _class(' + a + ')');
      };

      return bind;
    } else {
      const bind = function() {
        return _class.apply(this, _args);
      };

      bind.prototype = _class.prototype;

      return bind;
    }
  },
  bind: function (_class, args) {
    const bind = function() {
      return _class.apply(this, args);
    };

    bind.prototype = _class.prototype;

    return bind;
  }
});


// Accessor
Container.Accessor = function () {
  this.separator = '/';

  this.getters = [function (context, name) {
    const method = 'get';
    if (Container.isFunction(context[method])) {
      return context[method].call(context, name);
    }
  }, function (context, name) {
    if (context[name]) {
      return context[name];
    }
  }];

  this.setters = [function (context, name, value) {
    const method = 'set';
    if (Container.isFunction(context[method])) {
      context[method].call(context, name, value);
      return true;
    }
  }, function (context, name, value) {
    context[name] = value;
    return true;
  }];

  this._new();
};

Container.extend(Container.Accessor.prototype, {
  _new: function () {

  },
  isPath: function (name) {
    return ('' + name).indexOf(this.separator) >= 0;
  },
  get: function (context, name) {
    if (Container.isObject(context)) {
      const names = Container.isArray(name)
        ? name.slice()
        : name.split(this.separator)
      ;

      if (names.length) {
        const name = names.shift();

        let result = undefined;

        for (let i = 0; i < this.getters.length; i++) {
          let getter = this.getters[i];
          result = getter(context, name);
          if (result !== undefined) break;
        }

        if (Container.isObject(result) && names.length) {
          return this.get(result, names);
        }

        return result;
      }
    }

    return undefined;
  },
  set: function (context, name, value) {
    if (Container.isObject(context)) {
      const names = Container.isArray(name)
        ? name.slice()
        : name.split(this.separator)
      ;
      const currentName = names.pop();
      const result = this.get(context, names);


      let done = false;

      if (Container.isObject(result)) {
        Container.each(this.setters, function (setter) {
          if (!done && setter(result, currentName, value)) {
            done = true;
          }
        });
      } else {
        // can not set
      }
    }
  }
});

module.exports = Container;
