var feathers = require('feathers');
var feathersSwagger = require('../lib');
var pkg = require('../package.json');

var port = 3000;
var app = feathers();

// Cross-Orign
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
 });

// configure
app.configure(feathersSwagger({
    docsPath:'/docs',
    version: pkg.version,
    basePath: '/api',
    resourcePath: '/example',
    info: {
        'title': pkg.name,
        'description': pkg.description,
        //'termsOfServiceUrl': 'http://helloreverb.com/terms/',
        'contact': 'glavin.wiechert@gmail.com',
        'license': 'MIT',
        'licenseUrl': 'https://github.com/Glavin001/feathers-swagger/blob/master/LICENSE'
    }
}));

app.use('/examples', {
    find: function(params, callback) {
        callback([]);
    },
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
    setup: function(app) {},
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


app.listen(port, function(){
    console.log('Feathers server listening on port '+port+'.');
});

module.exports = app;