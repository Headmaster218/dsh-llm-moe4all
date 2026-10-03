import { createServer } from 'node:http'

const port = Number.parseInt(process.argv[2] ?? '', 10)
if (!Number.isInteger(port)) throw new Error('expected a port')

console.error('fake engine loading')

const server = createServer((request, response) => {
  if (request.url === '/health') {
    response.writeHead(200, { 'content-type': 'application/json' })
    response.end('{"status":"ok"}')
    return
  }
  response.writeHead(404)
  response.end()
})

server.listen(port, '127.0.0.1')

const close = () => server.close(() => process.exit(0))
process.on('SIGINT', close)
process.on('SIGTERM', close)
