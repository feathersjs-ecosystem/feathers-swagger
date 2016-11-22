# feathers-swagger [![Build Status](https://travis-ci.org/feathersjs/feathers-swagger.png?branch=master)](https://travis-ci.org/feathersjs/feathers-swagger) [![NPM version](https://badge.fury.io/js/feathers-swagger.png)](http://badge.fury.io/js/feathers-swagger)

[![NPM](https://nodei.co/npm/feathers-swagger.png?downloads=true&stars=true)](https://nodei.co/npm/feathers-swagger/)


> Add documentation to your [Featherjs](https://github.com/feathersjs/feathers) services and feed them to [Swagger UI](https://github.com/wordnik/swagger-ui).

**Please see the [example](https://github.com/feathersjs/feathers-swagger#example) below.**

## Getting Started

To install feathers-swagger from [npm](https://www.npmjs.org/), run:

```bash
$ npm install feathers-swagger --save
```

Finally, to use the plugin in your Feathers app:

```javascript
// Require
var feathers = require('feathers');
var feathersSwagger = require('feathers-swagger');
var Definition = feathersSwagger.util.Definition;
var Propertie = feathersSwagger.util.Propertie;
// Setup
var app = feathers();

/* ===== Important: Feathers-Swagger part below ===== */
// Use Feathers Swagger Plugin 
app.configure(feathersSwagger({
/* example configuration */
    docsPath:'/docs',
    version: pkg.version,
    basePath: '/',
    info: {
        'title': pkg.name,
        'description': pkg.description,
        'termsOfServiceUrl': 'http://helloreverb.com/terms/',
        'contact': {
            email: 'glavin.wiechert@gmail.com'
        },
        'version': '2.0',
        'license': {
            name: 'MIT',
            'url': 'https://github.com/Glavin001/feathers-swagger/blob/master/LICENSE'
        }
    }
}));

// Add your service(s)
app.use('/examples', {

    // Standard `find` method for a sevice.
    // Will automatically detect that `find` is available and create documentation for it.
    find: function(params, callback) {
        callback([]);
    },

    /*
    // The following methods will not be added to documentation,
    // because they are commented out and so do not exist for this service.
    get: function(id, params, callback) {
        callback({});
    },
    create: function(data, params, callback) {
        callback({});
    },
    update: function(id, data, params, callback) {
        callback({});
    },
    remove: function(id, params, callback) {
        callback({});
    },
    */

    // Below is optional: showing the more advanced customization options.
    docs: {
        description: "Operations about examples.",
        find: {
            type: 'Example',
            parameters: [{
                description: 'Get examples by name',
                in: 'path',
                required: true,
                name: 'name',
                type: 'string'
            }],
            responses: {
                '500': {
                    description: 'Example error'
                }
            }
        },
        models: {
            definitions: {
                paginate: new Definition({}, 'object', {
                    total: new Propertie('INTEGER'),
                    limit: new Propertie('INTEGER'),
                    skip: new Propertie('INTEGER'),
                    data: new Propertie('ARRAY', {
                        type: "object"
                    })
                })
            }
        }
    }
});

// Finally, start your server.
app.listen(3000, function(){
    console.log('Feathers server listening on port '+port+'.');
});
```

Provide support to `sequelize`, here are examples
```
var feathersSwagger = require('../lib');
var Definition = feathersSwagger.util.Definition;
var Propertie = feathersSwagger.util.Propertie;

[...]

app.configure(function(){
    // Add your service(s)
    var model = user(this.get('sequelize')),
        options = {
            Model: model,
            paginate: {
                default: 5,
                max: 25
            }
        };

    var doc = {
        description: 'Operations about Users.',
        definitions: {
            paginate: Definition({}, 'object', {
                total: Propertie('INTEGER'),
                limit: Propertie('INTEGER'),
                skip: Propertie('INTEGER'),
                data: Propertie('ARRAY', {
                    '$ref': '#/definitions/users'
                })
            })
        },
        definition: Definition(model),
        find: {
            parameters: [{
                description: 'Get examples by name',
                in: 'path',
                required: true,
                name: 'name',
                type: 'string'
            }],
            responses: {
                '200': {
                    description: 'successful operation',
                    schema: {
                        '$ref': '#/definitions/paginate'
                    }
                }
            }
        }
    };

    // Initialize our service with any options it requires
    this.use('/users', Object.assign(service(options), {docs: doc}));
});
```

To view, go to [the Swagger UI demo at http://swagger.wordnik.com/](http://swagger.wordnik.com/) 
and change the base url from `http://petstore.swagger.wordnik.com/api/api-docs`
to `http://localhost:3000/api/docs`

## Example

See the [example directory](https://github.com/feathersjs/feathers-swagger/tree/master/example) for example source code.

To run the example, see the [Contributing instructions below](https://github.com/feathersjs/feathers-swagger/#contributing).

**The following screenshot was created with the example.**

![screenshot](https://github.com/feathersjs/feathers-swagger/raw/master/example/screenshot_1.png)

## Documentation

See the [docs directory](https://github.com/feathersjs/feathers-swagger/tree/master/docs).

## Contributing

Clone this repository and run the following:

### Install Dependencies

```bash
npm install
bower install
```

### Run for Development

```bash
grunt develop
```

## Author

- [Glavin Wiechert](https://github.com/Glavin001)

## License

Copyright (c) 2014 [Glavin Wiechert](https://github.com/Glavin001)

Licensed under the [MIT license](LICENSE).
