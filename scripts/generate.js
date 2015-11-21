/* jshint asi: true */

var fs = require('fs')
var _ = require('lodash')
var UUID = require('node-uuid')

var osmData = JSON.parse(fs.readFileSync('tmp/overpass-data.json', 'utf8'))
var sportsMapping = JSON.parse(fs.readFileSync('mappings/dbo-wd-osm.jsonld', 'utf8'))
var sportsData = JSON.parse(fs.readFileSync('mappings/icons-names.jsonld', 'utf8'))
var osmGrouped = _.groupBy(osmData.elements, function (el) {
  if(el.tags && el.tags.sport) {
    return el.tags.sport
  } else {
    return null
  }
})

function tag2id (tag) {
  var sport = _.find(sportsMapping['@graph'], function (sport) {
    return sport.wd2osm === 'Tag:sport=' + tag
  })
  if (sport) return sport.id
}

function id2tag (id) {
  return _.find(sportsMapping['@graph'], function (sport) {
    return sport.id === id
  }).wd2osm.replace('Tag:sport=', '')
}

function genId (useHash) {
  var id = uriSpace + UUID.v4()
  if (useHash) id += '#id'
  return id
}

function lgdId (type, id) {
  return 'http://linkedgeodata.org/triplify/' + type + id
}

function getLat (place) {
  if(place.type === 'node') {
    return place.lat
  } else if (place.type === 'way') {
    return _.find(osmData.elements, function (el) {
      return el.id === place.nodes[0]
    }).lat
  } else {
    throw 'oops'
  }
}

function getLon (place) {
  if(place.type === 'node') {
    return place.lon
  } else if (place.type === 'way') {
    return _.find(osmData.elements, function (el) {
      return el.id === place.nodes[0]
    }).lon
  } else {
    throw 'oops'
  }
}


var uriSpace = "http://sporthub.demo.hackers4peace.net/"
var dataset = {
  '@context': 'https://w3id.org/plp/v1'
}

var describesSports = { }
var describesPlaces = { }

dataset[uriSpace] = [
  {
    id: uriSpace,
    describes: uriSpace + '#id'
  }, {
    id: uriSpace + '#id',
    type: 'Dataset',
    uriSpace: uriSpace,
    classPartition: []
  }
]

var sportList = {
  id: genId(),
  type: 'Collection'
}

var sportDataset = {
  id: sportList.id + '#id',
  type: 'Dataset',
  entityClass: 'Sport'
}

sportListContains = []

_.each(sportsMapping['@graph'], function (sport) {
  var clone = { id: sport.id }
  clone.describedBy = genId()

  // describedBy
  describesSports[sport.id] = clone.describedBy

  var data = _.find(sportsData['@graph'], function (s) {
    return s.id === sport.id
  })

  clone.icon = data.icon
  clone.nameMap = data.nameMap
  // add sport to dataset
  sportListContains.push(clone)


})

// set totalItems
sportList.totalItems = sportListContains.length
sportList.contains = sportListContains
sportDataset.totalItems = sportList.totalItems

// push short list
dataset[uriSpace][1].classPartition.push(sportDataset)

// add to dataset
// TODO also add sportDataset
dataset[sportList.id] = [ sportDataset, sportList ]


var placeList = {
  id: genId(),
  type: 'Collection'
}

var placeDataset = {
  id: placeList.id + '#id',
  type: 'Dataset',
  entityClass: 'Place'
}

var placeListContains = []

_.each(osmGrouped, function (list, tag) {
  if(describesSports[tag2id(tag)]) {
    _.each(list, function (place) {
      var clone = {
        id: lgdId(place.type, place.id),
        describedBy: genId(),
        type: 'Place',
        featuresSport: [ tag2id(place.tags.sport) ],
        latitude: getLat(place),
        longitude: getLon(place)
      }
      placeListContains.push(clone)

      // describedBy
      describesPlaces[clone.id] = clone.describedBy
    })
  }
})

// set totalItems
placeList.totalItems = placeListContains.length
placeList.contains = placeListContains
placeDataset.totalItems = placeList.totalItems

// push short list
dataset[uriSpace][1].classPartition.push(placeDataset)

// add to dataset
// TODO also add placeDataset
dataset[placeList.id] = [ placeDataset, placeList ]


var personList = {
  id: genId(),
  type: 'Collection',
  totalItems: 0,
  contains: []
}

var personDataset = {
  id: personList.id + '#id',
  type: 'Dataset',
  entityClass: 'Person'
}
dataset[uriSpace][1].classPartition.push(personDataset)

// add to dataset
dataset[personList.id] = [ personDataset, personList ]


var activityList = {
  id: genId(),
  type: 'Collection',
  totalItems: 0,
  contains: []
}

var activityDataset = {
  id: activityList.id + '#id',
  type: 'Dataset',
  entityClass: 'Activity'
}
dataset[uriSpace][1].classPartition.push(activityDataset)

// add to dataset
dataset[activityList.id] = [ activityDataset, activityList ]

fs.writeFileSync('tmp/graph.jsonld', JSON.stringify(dataset))

// TODO still needed?
//console.log(describesSports)
//console.log(describesPlaces)
