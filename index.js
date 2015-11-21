/* jshint asi: true */
var fs = require('fs')
var _ = require('lodash')
var Hapi = require('hapi')
var config = require('./config.json')

var graph = JSON.parse(fs.readFileSync('tmp/graph.jsonld', 'utf8'))

var uriSpace = 'http://' + config.server.host + '/'

function getDescribed (uri) {
  var describedUri = _.find(graph[uri], function (obj) {
    return obj.id === uri
  }).describes
  return _.find(graph[uri], function (obj) {
    return obj.id === describedUri
  })
}

function getDescribed (uri) {
  var describedUri = _.find(graph[uri], function (obj) {
    return obj.id === uri
  }).describes
  return _.find(graph[uri], function (obj) {
    return obj.id === describedUri
  })
}

function getResource (uri) {
  return _.find(graph[uri], function (obj) {
    return obj.id === uri
  })
}

var server = new Hapi.Server()

server.register([
  {
    register: require('good'),
    options: {
      reporters: [{
        reporter: require('good-console'),
        events: {
          response: '*',
          log: '*'
        }
      }]
    }
  }], function(err) {

  if(err) throw err

  server.connection({
    host: config.server.host,
    port: config.server.port,
    address: config.server.address
  });

  server.route({
    method: 'GET',
    path: '/{all*}',
    config: { cors: true },
    handler: function(request, reply) {
      // FIXME: don't hard code http://
      var uri = 'http://' + config.server.host + request.path
      reply(JSON.stringify({ '@graph': graph[uri] }))
    }
  });

  var dataset = getDescribed(uriSpace)

  var endpoint = _.find(dataset.classPartition, function (sub) {
    return sub.entityClass === 'Activity'
  }).id.replace('#id', '')

  var activities = getResource(endpoint)

  server.route({
    method: 'POST',
    path: endpoint.replace(uriSpace, '/'),
    config: { cors: true },
    handler: function(request, reply) {
      // FIXME: don't hard code http://
      activities.contains.push(request.payload)
      reply(request.payload).code(201)
    }
  });

  server.start(function() {
    server.log('info', 'Server running at:' + server.info.uri)
  });
});
