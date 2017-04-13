/* eslint-disable no-unused-expressions */

import { expect } from 'chai';
import feathers from 'feathers';
import rest from 'feathers-rest';
import memory from 'feathers-memory';
import rp from 'request-promise';
import swagger from '../src';

describe('feathers-swagger', () => {
  it('is CommonJS compatible', () => {
    expect(typeof require('../lib')).to.equal('function');
  });

  describe('basic functionality', () => {
    let server;

    before(done => {
      const app = feathers()
        .configure(rest())
        .configure(swagger({
          docsPath: '/docs',
          info: {
            'title': 'A test',
            'description': 'A description'
          }
        }))
        .use('/messages', memory());

      server = app.listen(6776, () => done());
    });

    after(done => server.close(done));

    it('supports basic functionality with a simple app', () => {
      return rp({
        url: 'http://localhost:6776/docs',
        json: true
      }).then(docs => {
        expect(docs.info.title).to.equal('A test');
        expect(docs.info.description).to.equal('A description');
        expect(docs.paths['/messages']).to.exist;
      });
    });
  });
});
