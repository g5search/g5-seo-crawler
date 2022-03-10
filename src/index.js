require('dotenv').config()
const express = require('express')
const app = express()
const port = process.env.PORT || 8080
const Audit = require('./auditer')

app.use(express.json({ limit: '1000kb' }))

app.get('/', (req, res) => res.send('I\'m Listening.'))

app.post('/', async (req, res) => {
  try {
    const { clientUrn, locationUrn } = req.body
    console.log(clientUrn, locationUrn)
    const audit = new Audit(req.body)
    await audit.start()
    res.json(audit.results)
  } catch (err) {
    console.log({ err })
    const formatAxiosError = (err) => ({
      status: err.response.status,
      url: err.response.config.url,
      message: 'Axios Error'
    })
    const response = err.isAxiosError
      ? formatAxiosError(err)
      : err.message
    res.status(503).send(response)
  }
})

app.listen(port, () => console.log(`:${port} I'm Listening.`))
