require('dotenv').config()
const express = require('express')
const app = express()
const port = process.env.PORT || 8080
const Audit = require('./auditer')

app.use(express.json({ limit: '1000kb' }))

app.get('/', (req, res) => res.send('I\'m Listening.'))

app.post('/', async (req, res) => {
  try {
    const audit = new Audit(req.body)
    await audit.start()
    const results = audit.results
    res.json(results)
  } catch (err) {
    const formatAxiosError = (err) => ({
      status: err.response.status,
      url: err.response.config.url,
      message: 'Axios Error'
    })
    const response = err.isAxiosError
      ? formatAxiosError(err)
      : err.message
    res.send(response)
  }
})

app.listen(port, () => console.log(`:${port} I'm Listening.`))
