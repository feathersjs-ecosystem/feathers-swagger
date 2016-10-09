var feathers = require('feathers');
var rest = require('feathers-rest');
var service = require('feathers-sequelize');
var Sequelize = require('sequelize');
var user = require('./user-model');
var bodyParser = require('body-parser');
var feathersSwagger = require('../lib');
var pkg = require('../package.json');
var path = require('path');

var port = 3000;
var app = feathers();

// Cross-Orign
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
 });

// Set Sequelize
app.set('sequelize', new Sequelize('sequelize','','', {
    dialect: 'sqlite',
    logging: false,
    storage: path.join(__dirname, '../db.sqlite')
}));

// configure
app
    // .configure(rest())
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended: true }))
    .configure(feathersSwagger({
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
    }))
    .configure(function(){
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
            definition: feathersSwagger.toModel(model)
        };

        // Initialize our service with any options it requires
        this.use('/users', Object.assign(service(options), {docs: doc}));
    });

// app.use('/pet', {
//     find: function(params) {
//         return Promise.resolve([]);
//     },
//     get: function(id, params) {
//         return Promise.resolve({});
//     },
//     create: function(data, params) {
//         return Promise.resolve({});
//     },
//     update: function(id, data, params) {
//         return Promise.resolve({});
//     },
//     remove: function(id, params) {
//         return Promise.resolve({});
//     },
//     setup: function(app) {
//         // console.log(app)
//     },
//     docs: {
//         description: 'Operations about examples.',
//         find: {
//             parameters: [{
//                 name: 'name',
//                 description: 'Filter Examples by name.',
//                 required: false,
//                 type: 'string',
//                 paramType: 'formData'
//             }],
//             responses: [
//                 {
//                     code: 500,
//                     reason: 'Example error.'
//                 }
//             ]
//         },
//         models: {
//             Example: {
//                 id: 'Example',
//                 description: 'This is an Example model.',
//                 required: ['name'],
//                 properties: {
//                     name: { 
//                         type: 'string',
//                         description: 'This is the example name.'
//                     },
//                     anotherProperty: {
//                         type:'string',
//                         description: 'This is the example description.'
//                     }
//                 }
//             }
//         }
//     }
// });


app.listen(port, function(){
    console.log('Feathers server listening on port '+port+'.');
});

module.exports = app;