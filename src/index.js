const express = require('express')
const app = express()
const port = process.env.PORT || 8080

app.use(express.json({ limit: '1000kb' }))

app.get('/', (req, res) => res.send('I\'m Listening.'))

app.post('/', async (req, res) => {
  try {
    const {
      url,
      rootDomain,
      singleDomain,
      corporate,
      clientUrn,
      locationUrn,
      sitemapUrl,
      discoverLinks,
      enabledAudits,
      enabledMetadata,
      config
    } = req.body
    // const audit = new Audit({})
    // res.json(audit.results)
    res.send(200)
  } catch (err) {
    res.status(503).send(err)
  }
})

app.listen(port, () => console.log(`:${port} I'm Listening.`))
