# feathers-swagger [![Build Status](https://travis-ci.org/Glavin001/feathers-swagger.png?branch=master)](https://travis-ci.org/Glavin001/feathers-swagger)

> Add documentation to your Featherjs services and feed them to Swagger UI. 

## Getting Started

To install feathers-swagger from [npm](https://www.npmjs.org/), run:

```bash
$ npm install feathers-swagger --save
```

Finally, to use the plugin in your Feathers app:

```javascript
// Require
var feathers = require('feathers');
var plugin = require('feathers-swagger');
// Setup
var app = feathers();
// Use Plugin
app.configure(plugin({ /* configuration */ }));
```

## Documentation

See the [docs](docs/).

## Author

- [Glavin Wiechert](https://github.com/Glavin001)

## License

Copyright (c) 2014 Glavin Wiechert

Licensed under the [MIT license](LICENSE).