// const express = require('express')
var configUtil = require('../libs/sb-config-util')
var _ = require('lodash')

const metaFilterRoutes = [
  'content/search',
  'course/search',
  'framework/category/search',
  'framework/term/search',
  'search',
  'framework/list'
]

const nonFilterRoutes = [
  'user/inbox',
  'tenant/info/sunbird'
]

var filterMiddleware = require('../middlewares/filter.middleware')
var httpMocks = require('node-mocks-http')

var baseUrl = 'http://localhost:5000/v1/'
var async = require('async')
var contentMetaConfig = require('./contentMetaConfig')

var allowedChannels = contentMetaConfig.allowedChannels
var blackListedChannels = contentMetaConfig.blackListedChannels

var allowedFramework = contentMetaConfig.allowedFramework
var blackListedFramework = contentMetaConfig.blacklistedFrameworkList

var allowedMimetype = contentMetaConfig.allowedMimetype
var blackListedMimetype = contentMetaConfig.blackListedMimetype

var allowedContenttype = contentMetaConfig.allowedContenttype
var blackListedContenttype = contentMetaConfig.blackListedContenttype

var allowedResourcetype = contentMetaConfig.allowedResourcetype
var blackListedResourcetype = contentMetaConfig.blackListedResourcetype

function generateConfigString (metaFiltersArray) {
  var configArray = {}
  _.forOwn(metaFiltersArray, function (value, key) {
    const allowedMetadata = value[0]
    const blackListedMetadata = value[1]
    if ((allowedMetadata && allowedMetadata.length > 0) && (blackListedMetadata && blackListedMetadata.length > 0)) {
      configArray[key] = _.difference(allowedMetadata, blackListedMetadata)
    } else if (allowedMetadata && allowedMetadata.length > 0) {
      configArray[key] = allowedMetadata
    } else if (blackListedMetadata && blackListedMetadata.length > 0) {
      configArray[key] = { 'ne': blackListedMetadata }
    }
  })
  return configArray
}
var metaFiltersArray = {
  'channel': [allowedChannels, blackListedChannels],
  'framework': [allowedFramework, blackListedFramework],
  'mimeType': [allowedMimetype, blackListedMimetype],
  'contentType': [allowedContenttype, blackListedContenttype],
  'resourceType': [allowedResourcetype, blackListedResourcetype]
}

var generateConfigArray = generateConfigString(metaFiltersArray)
describe('Check for all required route to call the AddMetaFilter', function () {
  async.forEach(metaFilterRoutes, function (route, callback) {
    describe('Composite search services', function () {
      var req, res
      var body = {
        'request': {
          'query': 'Test',
          'filters': {}
        }
      }

      beforeEach(function (done) {
        req = httpMocks.createRequest({
          method: 'POST',
          uri: baseUrl + route,
          body: body
        })

        res = httpMocks.createResponse()

        done() // call done so that the next test can run
      })
      it('check for filter in config with route', function () {
        filterMiddleware.addMetaFilters(req, res, function next () {
          expect(req.body.request.filters).toBeDefined()
        })
      })
      it('check for filter in config with value ' + route, function () {
        const allwhiteListedFilterQuery = {
          channel: ['b00bc992ef25f1a9a8d63291e20efc8d'],
          framework: [ 'NCF' ],
          contentType: [ 'Resource' ],
          mimeType: [ 'application/vnd.ekstep.content-collection' ],
          resourceType: [ 'Learn' ]
        }
        configUtil.setConfig('META_FILTER_REQUEST_JSON', allwhiteListedFilterQuery)

        filterMiddleware.addMetaFilters(req, res, function next () {
          var filterQuery = generateConfigArray

          // channels
          if (allowedChannels && allowedChannels.length > 0 && blackListedChannels && blackListedChannels.length > 0) {
            expect(req.body.request.filters.channel).toEqual(filterQuery.channel)
          } else if (allowedChannels && allowedChannels.length > 0) {
            expect(req.body.request.filters.channel).toEqual(allowedChannels)
          } else if (blackListedChannels && blackListedChannels.length > 0) {
            expect(req.body.request.filters.channel).toEqual(blackListedChannels)
          }

          // framework
          if (allowedFramework && allowedFramework.length > 0 && blackListedFramework &&
            blackListedFramework.length > 0) {
            expect(req.body.request.filters.framework).toEqual(filterQuery.framework)
          } else if (allowedFramework && allowedFramework.length > 0) {
            expect(req.body.request.filters.framework).toEqual(allowedFramework)
          } else if (blackListedFramework && blackListedFramework.length > 0) {
            expect(req.body.request.filters.framework).toEqual(blackListedFramework)
          }

          // contentType
          if (allowedContenttype && blackListedContenttype) {
            expect(req.body.request.filters.contentType).toEqual(filterQuery.contentType)
          } else if (allowedContenttype && allowedContenttype.length > 0) {
            expect(req.body.request.filters.contentType).toEqual(allowedContenttype)
          } else if (blackListedContenttype && blackListedContenttype.length > 0) {
            expect(req.body.request.filters.contentType).toEqual(blackListedContenttype)
          }

          // mimeType
          if (allowedMimetype && blackListedMimetype) {
            expect(req.body.request.filters.mimeType).toEqual(filterQuery.mimeType)
          } else if (allowedMimetype && allowedMimetype.length > 0) {
            expect(req.body.request.filters.mimeType).toEqual(allowedMimetype)
          } else if (blackListedMimetype && blackListedMimetype.length > 0) {
            expect(req.body.request.filters.mimeType).toEqual(blackListedMimetype)
          }

          // resourceType
          if (allowedResourcetype && blackListedResourcetype) {
            expect(req.body.request.filters.resourceType).toEqual(filterQuery.resourceType)
          } else if (allowedResourcetype && allowedResourcetype.length > 0) {
            expect(req.body.request.filters.resourceType).toEqual(allowedResourcetype)
          } else if (blackListedResourcetype && blackListedResourcetype.length > 0) {
            expect(req.body.request.filters.resourceType).toEqual(blackListedResourcetype)
          }
        })
      })
    })
  })
})
describe('Check for routes not to call the AddMetaFilter', function () {
  // it('if framework filter calls the route, addMetaFilter should not be called ', function () {
  async.forEach(nonFilterRoutes, function (route, callback) {
    describe('Composite search services for non filters', function (done) {
      var req
      var body = {
        'request': {
          'query': 'Test',
          'filters': {}
        }
      }
      beforeEach(function (done) {
        req = httpMocks.createRequest({
          method: 'POST',
          uri: baseUrl + route,
          body: body
        })

        done()
      })
      it('if framework filter calls the route, addMetaFilter should not be called  ' + route, function () {
        const allwhiteListedFilterQuery = {
          channel: ['b00bc992ef25f1a9a8d63291e20efc8d'],
          framework: [ 'NCF' ],
          contentType: [ 'Resource' ],
          mimeType: [ 'application/vnd.ekstep.content-collection' ],
          resourceType: [ 'Learn' ]
        }
        configUtil.setConfig('META_FILTER_REQUEST_JSON', allwhiteListedFilterQuery)
        expect(!_.includes(metaFilterRoutes, route)).toBeTruthy()
        expect(req.body.request.filters).toEqual({})
      })
    })
  })
})