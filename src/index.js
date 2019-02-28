const express = require('express')
const graphqlHTTP = require('express-graphql')
const mongoose = require('mongoose')

require('dotenv').config()

const mongodb = process.env.MONGODB_HOST || 'mongodb://localhost:27017/graphql'
mongoose.Promise = global.Promise
mongoose.connect(mongodb)
mongoose.connection
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Error: ', err))

const app = express()

app.use(express.json())

const schema = require('./graphql/schema')
const rootValue = require('./graphql/resolvers')

app.use(
  '/graphql',
  graphqlHTTP({
    schema,
    rootValue,
    graphiql: true
  })
)

app.listen(4000, () => {
  console.log('Server running on port 4000')
})
