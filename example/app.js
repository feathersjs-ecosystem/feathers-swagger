var cors = require('cors');
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

// Set Sequelize
app.set('sequelize', new Sequelize('sequelize','','', {
    dialect: 'sqlite',
    logging: false,
    storage: path.join(__dirname, '../db.sqlite')
}));

// configure
app
    .options('*',cors())
    .use(cors())// Cross-Orign
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended: true }))
    .configure(feathersSwagger({
        docsPath:'/docs',
        version: pkg.version,
        basePath: '/',
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
    .configure(rest())
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
            definitions: {
                paginate: new feathersSwagger.util.Definition({}, 'object', {
                    total: new feathersSwagger.util.Propertie('INTEGER'),
                    limit: new feathersSwagger.util.Propertie('INTEGER'),
                    skip: new feathersSwagger.util.Propertie('INTEGER'),
                    data: new feathersSwagger.util.Propertie('ARRAY', {
                        '$ref': '#/definitions/users'
                    })
                })
            },
            definition: new feathersSwagger.util.Definition(model),
            find: {
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


app.listen(port, function(){
    console.log('Feathers server listening on port '+port+'.');
});

module.exports = app;