### Example with feathers generated authentication on feathersjs v5 (dove) <!-- {docsify-ignore} -->

1. When you have generated the app with authentication you have to add some things to the initial
   specs when registering feathers-swagger.

   ```typescript
   app.configure(
     swagger({
       specs: {
         info: {
           title: 'Feathers app with swagger with authentication',
           version: '1.0.0',
           description: '...',
         },
         components: {
           securitySchemes: {
             BearerAuth: {
               type: 'http',
               scheme: 'bearer',
             },
           },
         },
         security: [{ BearerAuth: [] }],
       },
       // other options ...
     }),
   );
   ```

2. Add documentation to the authentication service (`src/authentication.ts`).
   This example shows local authentication.

   ```typescript {"highlight": "12-16, 21-71", "lineNumbers": true}
   import { AuthenticationService, JWTStrategy } from '@feathersjs/authentication';
   import { LocalStrategy } from '@feathersjs/authentication-local';
   import type { Application } from './declarations';
   import { ServiceSwaggerOptions } from '../../feathers-swagger';
   
   declare module './declarations' {
     interface ServiceTypes {
       authentication: AuthenticationService;
     }
   }
   
   declare module '@feathersjs/authentication' {
     class AuthenticationService {
       docs: ServiceSwaggerOptions;
     }
   }
   
   export const authentication = (app: Application) => {
     const authentication = new AuthenticationService(app);
     
     authentication.docs = {
       idNames: {
         remove: 'accessToken',
       },
       idType: 'string',
       securities: ['remove', 'removeMulti'],
       multi: ['remove'],
       schemas: {
         authRequest: {
           type: 'object',
           properties: {
             strategy: { type: 'string' },
             email: { type: 'string' },
             password: { type: 'string' },
           },
         },
         authResult: {
           type: 'object',
           properties: {
             accessToken: { type: 'string' },
             authentication: {
               type: 'object',
               properties: {
                 strategy: { type: 'string' },
               },
             },
             payload: {
               type: 'object',
               properties: {}, // TODO
             },
             user: { $ref: '#/components/schemas/User' },
           },
         },
       },
       refs: {
         createRequest: 'authRequest',
         createResponse: 'authResult',
         removeResponse: 'authResult',
         removeMultiResponse: 'authResult',
       },
       operations: {
         remove: {
           description: 'Logout the currently logged in user',
           'parameters[0].description': 'accessToken of the currently logged in user',
         },
         removeMulti: {
           description: 'Logout the currently logged in user',
           parameters: [],
         },
       },
     };
       
     authentication.register('jwt', new JWTStrategy());
     authentication.register('local', new LocalStrategy());
     
     app.use('authentication', authentication);
   };
   ```

3. Set the `security` option for `service.docs` like shown in
   [Using Schemas of Feathersjs v5 (dove)](/examples/generated_service_v5.md) for methods that are protected. 
   If all methods are protected `all` can be used.

4. If you want to provide simple authentication usage on the SwaggerUI using Email/Username and Password,
   you can use the [Swagger UI Plugin ApiKeyAuthForm](https://github.com/Mairu/swagger-ui-apikey-auth-form).

   Here is an example of an `openapi.ts` swagger configuration file, that can used with `api.configure();`

   ```typescript
   import swagger from 'feathers-swagger';
   import type { FnSwaggerUiGetInitializerScript } from 'feathers-swagger';
   import type { Application } from './declarations';
   
   const getSwaggerInitializerScript: FnSwaggerUiGetInitializerScript = ({ docsJsonPath, ctx }) => {
     const headers = ctx && ctx.headers;
     const basePath = headers!['x-forwarded-prefix'] ?? '';
   
     // language=JavaScript
     return `
       window.onload = function () {
         var script = document.createElement('script');
         script.onload = function () {
           window.ui = SwaggerUIBundle({
             url: "${basePath}${docsJsonPath}",
             dom_id: '#swagger-ui',
             deepLinking: true,
             presets: [
               SwaggerUIBundle.presets.apis,
               SwaggerUIStandalonePreset,
               SwaggerUIApiKeyAuthFormPlugin,
             ],
             plugins: [
               SwaggerUIBundle.plugins.DownloadUrl
             ],
             layout: "StandaloneLayout",
             configs: {
               apiKeyAuthFormPlugin: {
                 forms: {
                   BearerAuth: {
                     fields: {
                       email: {
                         type: 'text',
                         label: 'E-Mail-Address',
                       },
                       password: {
                         type: 'password',
                         label: 'Password',
                       },
                     },
                     authCallback(values, callback) {
                       window.ui.fn.fetch({
                         url: '/authentication',
                         method: 'post',
                         headers: {
                           Accept: 'application/json',
                           'Content-Type': 'application/json'
                         },
                         body: JSON.stringify({
                           strategy: 'local',
                           ...values,
                         }),
                       }).then(function (response) {
                         const json = JSON.parse(response.data);
                         if (json.accessToken) {
                           callback(null, json.accessToken);
                         } else {
                           callback('error while login');
                         }
                       }).catch(function (err) {
                         console.log(err, Object.entries(err));
                         callback('error while login');
                       });
                     },
                   }
                 },
                 localStorage: {
                   BearerAuth: {}
                 }
               }
             }
           });
         };
   
         script.src = '//cdn.jsdelivr.net/npm/@mairu/swagger-ui-apikey-auth-form@1/dist/swagger-ui-apikey-auth-form.js';
         document.head.appendChild(script)
       };
     `;
   };
   
   export default (app: Application) => {
     // If you don't use custom methods this line can be removed
     app.configure(swagger.customMethodsHandler);
   
     app.configure(
       swagger({
         specs: {
           info: {
             title: 'Example with Authentication',
             version: '1.0.0',
             description: 'Example with Authentication and SwaggerUI ApiKeyAuthForm plugin',
           },
           components: {
             securitySchemes: {
               BearerAuth: {
                 type: 'http',
                 scheme: 'bearer',
               },
             },
           },
           security: [{ BearerAuth: [] }],
         },
         ui: swagger.swaggerUI({ getSwaggerInitializerScript }),
       }),
     );
   };
   ```

   Here is a preview together with a user service from [Using Schemas of Feathersjs v5 (dove)](/examples/generated_service_v5.md):


[filename](../swagger-ui/index.html?url=../examples/authentication_v5_plugin.json ':include class=swui-preview')
