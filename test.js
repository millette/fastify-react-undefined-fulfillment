'use strict'

const t = require('tap')
const test = t.test
const Fastify = require('fastify')
const { join } = require('path')
const { readFileSync, createWriteStream } = require('fs')

test('should serve /_next/* static assets', t => {
  t.plan(18)

  const stream = createWriteStream('./unfulfilled.ndjson')

  const buildId = readFileSync(join(__dirname, '.next', 'BUILD_ID'), 'utf-8')
  const manifest = require('./.next/build-manifest.json')

  const fastify = Fastify( { logger: { stream, level: 'error' } })

  fastify
    .register(require('fastify-react'))
    .after(() => {
      fastify.next('/hello')
    })

  const pagePrefix = `/_next/static/${buildId}/pages`

  testNextAsset(t, fastify, `${pagePrefix}/hello.js`)
  testNextAsset(t, fastify, `${pagePrefix}/_app.js`)
  testNextAsset(t, fastify, `${pagePrefix}/_error.js`)

  let commonAssets = manifest.pages['/hello']
  commonAssets.map(suffix => testNextAsset(t, fastify, `/_next/${suffix}`))

  fastify.close()
})

function testNextAsset (t, fastify, url) {
  fastify.inject({ url, method: 'GET' }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 200)
    t.equal(res.headers['content-type'],
      'application/javascript; charset=UTF-8')
  })
}
