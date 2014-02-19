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
    path:'/api/docs',
    version: pkg.version,
    basePath: 'http://locahost:3000/',
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
    setup: function(app) {}
})


app.listen(port, function(){
    console.log('Feathers server listening on port '+port+'.');
});

module.exports = app;