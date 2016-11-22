// Require
const feathers = require('feathers');
const rest = require('feathers-rest');
const service = require('feathers-sequelize');
const cors = require('cors');
const path = require('path');
const hooks = require('feathers-hooks');
const authentication = require('feathers-authentication');
const Sequelize = require('sequelize');
const user = require('./user-model');
const bodyParser = require('body-parser');
const swagger = require('../../lib');
const pkg = require('../../package.json');

const port = 3030;
// Setup
const app = feathers();

// Set Sequelize
app.set('sequelize', new Sequelize('sequelize', '', '', {
  dialect: 'sqlite',
  logging: false,
  storage: path.join(__dirname, '../../db.sqlite')
}));

// configure
app.options('*', cors())
  .use(cors()) // Cross-Orign
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({
    extended: true
  }))
  /* ===== Important: Feathers-Swagger part below ===== */
  // Use Feathers Swagger Plugin
  .configure(swagger({
    docsPath: '/docs',
    version: pkg.version,
    uiIndex: path.join(__dirname, 'docs.html'),
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
    },
    security: {
      'type': 'apiKey',
      'name': 'authorization',
      'in': 'header'
    },
    securityDefinitions: {
      'authorization': {
        'type': 'apiKey',
        'name': 'authorization',
        'in': 'header'
      }
    },
    definitions: {
      'local': {
        type: 'object',
        properties: {
          email: {
            type: 'string',
          },
          password: {
            type: 'string',
          }
        }
      },
      'token': {
        type: 'object',
        properties: {
          token: {
            type: 'string',
          }
        }
      },
      'paginate': swagger.definition({
        attributes: {
          total: Sequelize.INTEGER,
          limit: Sequelize.INTEGER,
          skip: Sequelize.INTEGER,
          data: Sequelize.ARRAY
        }
      })
    }
  }))
  .configure(hooks())
  .configure(rest())
  .configure(function() {
    const app = this;
    const config = {
      'idField': 'id',
      'token': {
        'secret': '7RJeSzXr2n/Mb15vl1lVAUs7PHNjvlV3ltJLpBjdJ93MPanV1HkFf5WjK/J4V2hqFaxALsPrqr7cgBPsA0M0DQ=='
      },
      'local': {}
    };
    app.configure(authentication(config));
  })
  .configure(function() {
    // Add your service(s)
    const model = user(this.get('sequelize')),
      options = {
        Model: model,
        paginate: {
          default: 5,
          max: 25
        }
      };

    const doc = {
      description: 'Operations about Users.',
      definitions: {
        'UserPaginate': swagger.definition({
          attributes: {
            data: Sequelize.ARRAY('users')
          }
        }, {
          extends: ['paginate']
        })
      },
      definition: swagger.definition(model),
      securities: ['find'],
      find: {
        parameters: [{
          description: 'Get examples by name',
          in : 'query',
          required: false,
          name: 'email',
          type: 'string'
        }],
        responses: {
          '200': {
            description: 'successful operation',
            schema: {
              '$ref': '#/definitions/UserPaginate'
            }
          }
        }
      }
    };

    // Initialize our service with any options it requires
    this.use('/users', Object.assign(service(options), {
      docs: doc
    }));

    const userService = this.service('/users');
    const auth = authentication.hooks;
    userService.before({
      create: [auth.hashPassword()],
      find: [
        auth.verifyToken(),
        auth.populateUser(),
        auth.restrictToAuthenticated()
      ]
    });
    userService.after({
      all: [hooks.remove('password')]
    });
  });


app.listen(port, function() {
  console.log('Feathers server listening on port ' + port + '.');
});

module.exports = app;
