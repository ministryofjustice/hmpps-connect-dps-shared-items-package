import fs from 'node:fs/promises'
import http from 'node:http'
import util from 'node:util'
import nunjucks from 'nunjucks'
import { rollup } from 'rollup'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import * as sass from 'sass'
// @ts-expect-error ESM doesn’t support directory import so typescript cannot find type declarations
// eslint-disable-next-line import/extensions
import { getAlertFlagLabelsForAlerts } from '../dist/index.esm.js'

const { css } = sass.compile('preview/shared-items.scss', {
  loadPaths: ['.', 'node_modules'],
})

const js = (
  await (
    await rollup({
      input: 'preview/shared-items.js',
      plugins: [nodeResolve({ preferBuiltins: true })],
      output: { format: 'cjs' },
    })
  ).generate({})
).output[0].code

const prisonerNumber = 'A1234AA'
const html = nunjucks
  .configure([
    'preview',
    'node_modules/govuk-frontend/dist/',
    'node_modules/@ministryofjustice/frontend/',
    'dist/assets/',
  ])
  .render('shared-items.njk', {
    prisonerNumber,
    alerts: getAlertFlagLabelsForAlerts(
      [
        {
          alertTypeCode: 'F',
          alertTypeDescription: 'Ex Armed Forces',
          code: 'F1',
          description: 'Armed Forces Veteran',
        },
        {
          alertTypeCode: 'M',
          alertTypeDescription: 'Medical',
          code: 'HID',
          description: 'Hidden disability',
        },
      ].map(alertCode => ({
        alertUuid: '01a02e89-7c79-705c-883a-9723e7d2cb83',
        prisonNumber: prisonerNumber,
        alertCode,
        description: 'Alert',
        activeFrom: '2026-01-01',
        isActive: true,
        createdByDisplayName: 'OMS_OWNER',
      })),
    ),
  })

const server = http.createServer(async (req, res) => {
  const [path, qs = ''] = (req.url || '').split('?')
  const params = new URLSearchParams(qs)

  process.stderr.write(`${req.method} ${path}\n`)

  if (path === '/') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    res.end(html)
  } else if (path === '/shared-items.css') {
    res.writeHead(200, { 'content-type': 'text/css; charset=utf-8' })
    res.end(css)
  } else if (path === '/shared-items.js') {
    res.writeHead(200, { 'content-type': 'application/javascript; charset=utf-8' })
    res.end(js)
  } else if (path === '/slow-modal-html') {
    setTimeout(() => {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      res.end('<p>Content loaded from url.</p>')
    }, 3000)
  } else if (path.startsWith('/api/addresses/find/')) {
    const query = path.slice('/api/addresses/find/'.length)
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ status: 200, results: [{ uprn: '12345678', addressString: `Address with ${query}` }] }))
  } else if (path === '/api/report-error') {
    process.stderr.write('Query parameters:\n')
    process.stderr.write(util.inspect(params))
    process.stderr.write('\n')
    res.writeHead(204, { 'content-type': 'text/plain' })
    res.end()
  } else if (req.method === 'POST' && path === '/inspect') {
    process.stderr.write('Query parameters:\n')
    process.stderr.write(util.inspect(params))
    process.stderr.write('\n')

    const chunks: Uint8Array[] = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', async () => {
      const body = Buffer.concat(chunks)
      fs.writeFile('preview/inspect.dat', body).then(() => {
        process.stderr.write('Body written to preview/inspect.dat\n')
      })
      res.writeHead(302, { 'content-type': 'text/html', location: '/' })
      res.end('')
    })
  } else if (path.startsWith('/assets/')) {
    try {
      const data = await fs.readFile(`node_modules/govuk-frontend/dist/govuk/assets/${path.slice('/assets/'.length)}`)
      res.writeHead(200)
      res.end(data)
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain' })
      res.end('Not Found')
    }
  } else {
    res.writeHead(404, { 'content-type': 'text/plain' })
    res.end('Not Found')
  }
})
process.stderr.write('Go to http://localhost:3000/\n')
server.listen(3000)
