const feathers = require('feathers');
const rest = require('feathers-rest');
const memory = require('feathers-memory');
const path = require('path');
const bodyParser = require('body-parser');
const swagger = require('../../lib');

const messageService = memory();

messageService.docs = {
  description: 'A service to send and receive messages',
  definitions: {
    messages: {
      "type": "object",
      "required": [
        "text"
      ],
      "properties": {
        "text": {
          "type": "string",
          "description": "The message text"
        },
        "useId": {
          "type": "string",
          "description": "The id of the user that send the message"
        }
      }
    }
  }
};

const app = feathers()
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .configure(rest())
  .configure(swagger({
    docsPath: '/docs',
    uiIndex: path.join(__dirname, 'docs.html'),
    info: {
      title: 'A test',
      description: 'A description'
    }
  }))
  .use('/messages', messageService);

console.log('Simple feathers-swagger example running on http://localhost:3030/docs/');

app.listen(3030);
