const express = require('express')
const bodyparser = require('body-parser')
const session = require('express-session')
const mysql2 = require('mysql2/promise');
const MySQLStore = require('express-mysql-session')(session);
const { check, validationResult } = require('express-validator')
require('./config/db.config')
require('dotenv').config()

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const options = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
}
const connection = mysql2.createPool(options)
const sessionStore = new MySQLStore({}, connection);

// Express Session
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: { maxAge: 30000 },
  })
)

// Prisma Client
const { PrismaClient } = require('@prisma/client')

// Prisma client Init
const { test } = new PrismaClient()

// Get all data
app.get('/', async (req, res) => {
  req.session.isAuth = true
  console.log(req.session)
  const user = await test.findMany({})
  res.json(user)
})

// Create Data
app.post('/', [(check('name').isAlpha(), check('city').isAlpha())], async (req, res) => {
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      msg: 'Value Should Not Be Numeric/ Nor It should Countain Numeric values',
    })
  }
  const { name, city } = req.body
  const newUser = await test.create({
    data: {
      name,
      city,
    },
  })
  res.json(newUser)
})

// Delete Data
app.delete('/:id', async (req, res) => {
  const params = req.params.id
  const user = await test.findUnique({
    where: {
      id: parseInt(params),
    },
  })

  if (!user) {
    return res.status(400).json({
      msg: 'OOoopsss! User Not Found',
    })
  } else {
    const deleteuser = await test.delete({
      where: {
        id: parseInt(params),
      },
    })
    res.json({ msg: 'User Deleted Successfully' })
  }
})

// Server Connection
const PORT = process.env.SERVER_PORT || 3001
app.listen(PORT, () => console.log(`Server Connected, Listion on Port ${PORT}`))
