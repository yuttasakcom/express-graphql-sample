const express = require('express')
const graphqlHTTP = require('express-graphql')
const { buildSchema } = require('graphql')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

require('dotenv').config()

const mongodb = process.env.MONGODB_HOST || 'mongodb://localhost:27017/graphql'
mongoose.Promise = global.Promise
mongoose.connect(mongodb)
mongoose.connection
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Error: ', err))

const Event = require('./models/event')
const User = require('./models/user')

const app = express()

const schema = buildSchema(`
  type Event {
    _id: ID!
    title: String!
    description: String!
    price: Float!
    date: String!
  }

  type User {
    _id: ID!
    email: String!
    password: String

  }

  input EventInput {
    title: String!
    description: String!
    price: Float!
    date: String!
  }

  input UserInput {
    email: String!
    password: String!
  }

  type RootQuery {
    events: [Event!]!
  }

  type RootMutation {
    createEvent(eventInput: EventInput): Event
    createUser(userInput: UserInput): User
  }

  schema {
    query: RootQuery
    mutation: RootMutation
  }
`)

const root = {
  events: () => {
    return Event.find()
      .then(events => {
        return events
      })
      .catch(err => {
        console.log(err)
        throw err
      })
  },
  createEvent: args => {
    const event = new Event({
      title: args.eventInput.title,
      description: args.eventInput.description,
      price: +args.eventInput.price,
      date: new Date(args.eventInput.date),
      creator: '5c76c1a06860b244bad7b56e',
    })

    let createdEvent

    return event
      .save()
      .then(result => {
        createdEvent = result
        return User.findById('5c76c1a06860b244bad7b56e')
      })
      .then(user => {
        if (!user) {
          throw new Error('User not found.')
        }
        user.createdEvents.push(event)
        return user.save()
      })
      .then(result => {
        return createdEvent
      })
      .catch(err => {
        console.log(err)
        throw err
      })
  },
  createUser: args => {
    return User.findOne({ email: args.userInput.email })
      .then(result => {
        if (result) {
          throw new Error('User exists already.')
        }
        return bcrypt.hash(args.userInput.password, 12)
      })
      .then(hashedPassword => {
        const user = new User({
          email: args.userInput.email,
          password: hashedPassword,
        })
        return user.save()
      })
      .then(result => {
        return { ...result._doc, password: null }
      })
      .catch(err => {
        throw err
      })
  },
}

app.use(
  '/graphql',
  graphqlHTTP({
    schema,
    rootValue: root,
    graphiql: true,
  })
)

app.listen(4000, () => {
  console.log('Server running on port 4000')
})
