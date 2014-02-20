# feathers-swagger [![Build Status](https://travis-ci.org/Glavin001/feathers-swagger.png?branch=master)](https://travis-ci.org/Glavin001/feathers-swagger) [![NPM version](https://badge.fury.io/js/feathers-swagger.png)](http://badge.fury.io/js/feathers-swagger)

[![NPM](https://nodei.co/npm/feathers-swagger.png?downloads=true&stars=true)](https://nodei.co/npm/feathers-swagger/)


> Add documentation to your Featherjs services and feed them to Swagger UI. 

**Please see the [example](https://github.com/Glavin001/feathers-swagger#example) below.**

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
// Setup
var app = feathers();

/* ===== Important: Feathers-Swagger part below ===== */
// Use Feathers Swagger Plugin
app.configure(feathersSwagger({ 
/* example configuration */ 
    docsPath:'/docs',
    version: '0.0.0',
    basePath: '/api',
    info: {
        'title': 'API',
        'description': 'This is an API.',
        'termsOfServiceUrl': 'https://github.com/Glavin001/feathers-swagger/blob/master/LICENSE',
        'contact': 'example@example.com',
        'license': 'MIT',
        'licenseUrl': 'https://github.com/Glavin001/feathers-swagger/blob/master/LICENSE'
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
                name: 'name',
                description: 'Filter Examples by name.',
                required: false,
                type: 'string',
                paramType: 'form'
            }],
            errorResponses: [
                {
                    code: 500,
                    reason: 'Example error.'
                }
            ]
        },
        models: {
            Example: {
                id: 'Example',
                description: 'This is an Example model.',
                required: ['name'],
                properties: {
                    name: { 
                        type: 'string',
                        description: 'This is the example name.'
                    },
                    anotherProperty: {
                        type:'string',
                        description: 'This is the example description.'
                    }
                }
            }
        }
    }
});

// Finally, start your server.
app.listen(3000, function(){
    console.log('Feathers server listening on port '+port+'.');
});
```

To view, go to [the Swagger UI demo at http://swagger.wordnik.com/](http://swagger.wordnik.com/) 
and change the base url from `http://petstore.swagger.wordnik.com/api/api-docs`
to `http://localhost:3000/api/docs`

## Example

See the [example directory](https://github.com/Glavin001/feathers-swagger/tree/master/example) for example source code.

To run the example, see the [Contributing instructions below](https://github.com/Glavin001/feathers-swagger/#contributing).

**The following screenshot was created with the example.**

![screenshot](https://github.com/Glavin001/feathers-swagger/raw/master/example/screenshot_1.png)

## Documentation

See the [docs directory](https://github.com/Glavin001/feathers-swagger/tree/master/docs).

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
