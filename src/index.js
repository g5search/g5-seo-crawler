require('dotenv').config()
const express = require('express')
const app = express()
const port = process.env.PORT || 8080
const Audit = require('./auditer')

app.use(express.json({ limit: '1000kb' }))

app.get('/', (req, res) => res.send('I\'m Listening.'))

app.post('/', async (req, res) => {
  try {
    console.log(req.body)
    const audit = new Audit(req.body)
    await audit.start()
    console.log(audit.results)
    // res.json(results)
    res.sendStatus(200)
  } catch (err) {
    res.status(503).send(err)
  }
})

app.listen(port, () => console.log(`:${port} I'm Listening.`))
