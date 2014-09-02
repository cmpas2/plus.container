describe('Container', function () {

    var container, Container = require('../src/Container');
    require('chai').should();

    beforeEach(function () {
        container = new Container();
    });

    it('should allow to register class: container.register("myService", function MyClass(){})', function () {
        var MyClass = function () {

        }
        container.register('myService', MyClass);
    });

    it('should allow to get instance: container.get("myService") // return new MyClass()', function () {

        var MyClass = function () {

        }

        container.register('myService', MyClass);
        var instance = container.get('myService');

        instance.should.be.instanceof(MyClass)
    });

    it('should return single instance: container.get("myService") === container.get("myService")', function () {

        var MyClass = function () {

        }

        container.register('myService', MyClass);

        var instance = container.get('myService');
        var instance2 = container.get('myService');

        instance.should.equal(instance2);
    });

    it('should allow to register value: container.register("myValue", "value")', function () {

        container.register('myValue', 'value');
        var instance = container.get('myValue');

        instance.should.equal('value');

    });

    it('should allow to get value: container.get("myValue")', function () {

        var complexValue = ['complex', 'value'];

        container.register('myValue', complexValue);
        var instance = container.get('myValue');

        instance.should.equal(complexValue);

    });

    it('should allow to register class with dependencies: container.register("myService", function MyClass(){}, ["dep1", "dep2"])', function () {

        // dep1
        var MyClass1 = function () {
            this.name = "MyClass1"
        }

        // dep2
        var myConfig = {my: 'config'};


        var MyClass2 = function (dep1, dep2) {
            this.dep1 = dep1;
            this.dep2 = dep2;
        }

        container.register('myService1', MyClass1);

        container.register('myConfig', myConfig);

        container.register('myService2', MyClass2, ['myService1', 'myConfig']);

    });

    it('should allow to get instance: container.get("myService") // return new MyClass(aDep1, aDep2)', function () {

        // dep1
        var MyClass1 = function () {
            this.name = "MyClass1"
        }

        // dep2
        var myConfig = {my: 'config'};


        var MyClass2 = function (dep1, dep2) {
            this.dep1 = dep1;
            this.dep2 = dep2;
        }

        container.register('myService1', MyClass1);

        container.register('myConfig', myConfig);

        container.register('myService2', MyClass2, ['myService1', 'myConfig']);

        var instance = container.get('myService2');

        instance.dep1.should.be.instanceof(MyClass1);
        instance.dep1.name.should.equal('MyClass1');

        instance.dep2.should.equal(myConfig);

    });

    it('should allow to register class with default dependencies: function MyClass(){}; MyClass.$inject = ["dep1", "dep2"]; container.register("myService", myService)', function () {
        // dep1
        var MyClass1 = function () {
            this.name = "MyClass1"
        }

        // dep2
        var myConfig = {my: 'config'};


        var MyClass2 = function (dep1, dep2) {
            this.dep1 = dep1;
            this.dep2 = dep2;
        }

        MyClass2.$inject = ['myService1', 'myConfig'];

        container.register('myService1', MyClass1);

        container.register('myConfig', myConfig);

        container.register('myService2', MyClass2); // there dependencies from $inject

    });

    it('should allow to get instance: container.get("myService") // return new MyClass(aDep1, aDep2)', function () {
        // dep1
        var MyClass1 = function () {
            this.name = "MyClass1"
        }

        // dep2
        var myConfig = {my: 'config'};


        var MyClass2 = function (dep1, dep2) {
            this.dep1 = dep1;
            this.dep2 = dep2;
        }

        MyClass2.$inject = ['myService1', 'myConfig'];

        container.register('myService1', MyClass1);

        container.register('myConfig', myConfig);

        container.register('myService2', MyClass2);

        var instance = container.get('myService2');

        instance.dep1.should.be.instanceof(MyClass1);
        instance.dep1.name.should.equal('MyClass1');

        instance.dep2.should.equal(myConfig);
    });

    it('should allow to register class factory: container.register("myServiceFactory", function MyClassFactory(){ return function MyClass(){} })', function () {

        var MyClass = function () {

        };

        function MyClassFactory() {
            return  MyClass
        }


        container.register('myServiceFactory', MyClassFactory);

        var instance = container.get('myServiceFactory');

        instance.should.equal(MyClass);

    });


    it('should allow to register object factory: container.register("myObjectFactory", function myObjectFactory(){ return { "key1": "value1" } })', function () {
        var MyClass = function () {

        };

        function MyObjectFactory() {
            return new MyClass()
        }


        container.register('myObjectFactory', MyObjectFactory);

        var instance = container.get('myObjectFactory');

        instance.should.be.instanceof(MyClass);
    });

    it('should allow to set value hard: container.set("myDependency", {my: "custom object"})', function () {
        var object = {my: "custom object"};
        container.set('myDependency', object);

        container.get('myDependency').should.equal(object);
    });

    it('should allow to remove definition hard: container.remove("myService") // container.get("myService") -> null', function () {

        var MyClass = function () {

        }

        container.register('myService', MyClass);

        var instance = container.get('myService');
        instance.should.be.instanceof(MyClass)


        container.remove('myService');

        var instance = container.get('myService');
        (instance === null).should.be.true;

    });

    it('should allow to create unique instance : container.create("myService") // always new instance', function () {

        var MyClass = function () {

        }

        container.register('myService', MyClass);

        var instance = container.create('myService');
        var instance2 = container.create('myService');

        instance.should.be.instanceof(MyClass);
        instance2.should.be.instanceof(MyClass);

        instance.should.not.equal(instance2);

    });

    it('should allow to get container in dependencies', function () {
        var container2 = container.get('container');
        container2.should.equal(container);
    })

    it('should return null if service not registered', function () {
        var instance = container.get('myService');
        (instance === null).should.be.true;

        var instance = container.create('myService');
        (instance === null).should.be.true;
    })

    it('should not create instance if service is not a function and return null', function () {
        container.register('myService', 'not a function');

        var instance = container.create('myService');
        (instance === null).should.be.true;
    })

    it('should support Container.load()', function () {

        var container = Container.load(
            {
                dir: __dirname + '/container1'
            });

        'dev_value'.should.equal(container.get('name'));
        'value1'.should.equal(container.get('name1'));
    })


    it('should support Container.load() for many folders', function () {

        var container = Container.load(
            {
                dir: [__dirname + '/container2', __dirname + '/container2.1']
            });

        'value1'.should.equal(container.get('name1'));
        'value2.1'.should.equal(container.get('name2'));
    })

    it('should support Container.load() for env', function () {

        var container = Container.load(
            {
                dir: __dirname + '/container1',
                env: 'test'
            });

        'test_value'.should.equal(container.get('name'));
        'value1'.should.equal(container.get('name1'));
    })

    it('should support container.load() sub container', function () {

        container.register('x', 1);
        container.register('y', 2);

        container.load({dir: __dirname + '/container4'});

        container.get('x').should.equal(1);
        container.get('y').should.equal(3);
    })

    it('should support Container.load() with default services', function () {

        var container = Container.load(
            {
                dir: __dirname + '/container1',
                services: {
                    service1: 'hi'
                }
            });

        'dev_value'.should.equal(container.get('name'));
        'hi'.should.equal(container.get('service1'));
    })

    it('should support search by tags', function () {

        var container = Container.load(
            {
                dir: __dirname + '/container3'
            });

        var tag1services = container.find(['tag1']);
        var tag12services = container.find(['tag1', 'tag2']);
        var tag0services = container.find(['tag0']);

        tag1services.length.should.equal(2);
        tag12services.length.should.equal(1);
        tag0services.length.should.equal(0);

        tag1services[0].should.deep.equal({CLASS: 1});
        tag12services[0].should.deep.equal({CLASS: 2});

        tag1services[1].should.deep.equal({CLASS: 2});
    })

    it('should support search by tags and exclude tags', function () {

        var container = Container.load(
            {
                dir: __dirname + '/container3'
            });

        var tag1services = container.find(['tag1']);
        tag1services.length.should.equal(2);

        tag1services[0].should.deep.equal({CLASS: 1});
        tag1services[1].should.deep.equal({CLASS: 2});

        var tag1minus2services = container.find(['tag1'], ['tag2']);
        tag1minus2services.length.should.equal(1);

        tag1services[0].should.deep.equal({CLASS: 1});
    })

    it('should allow to merge containers', function () {

        var container1 = new Container();
        var container2 = new Container();

        container1.register('x', 1);
        container2.register('y', 2);

        container1.merge(container2);

        container1.get('x').should.equal(1);
        container1.get('y').should.equal(2);
    })

});
