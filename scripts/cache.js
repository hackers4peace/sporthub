/* jshint asi: true */

var fs = require('fs')
var request = require('then-request')

var filename = 'tmp/overpass-data.json'

var api = 'http://overpass-api.de/api/interpreter'
var bbox = '(54.34455044818014,18.27369689941406,54.491978341422985,18.919143676757812)'

var query = '[out:json][timeout:25]; ('
query += 'node["sport"]' + bbox + ';'
query += 'way["sport"]' + bbox + ';'
query += '); out body; >; out skel qt;'

console.log('query: ', query);

request('POST', api, { body: query }).done(function (res) {
  fs.writeFileSync(filename, res.getBody())
  console.log('wrote: ', filename)
})
