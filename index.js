const express = require('express')
const pool = require('./db')
const loginRouter = require('./api/login')
const userRouter = require('./api/users')
const coachRouter = require('./api/coaches')
const clientRouter = require('./api/clients')
const connectRouter = require('./api/connection')
const applicationRouter = require('./api/applications')
const reservationRouter = require('./api/reservations')

const app = express()

// Middlewares
require('dotenv').config()
app.use(express.json())


// Tests
app.get('/', (req, res) => {
    res.status(200).send({ message: 'Hello World' })
})

app.post('/', async (req, res) => {
    try {
        const response = await pool.query('CREATE TABLE test (id INT)')

        res.status(200).send({ message: 'Successfully created a table', response: response.rows })
    } catch (error) {
        console.log('Error creating a table: ', error)
    }
})

// Routes
app.use('/login', loginRouter)
app.use('/users', userRouter)
app.use('/coaches', coachRouter)
app.use('/clients', clientRouter)
app.use('/connection', connectRouter)
app.use('/applications', applicationRouter)
app.use('/reservations', reservationRouter)

app.listen(process.env.API_PORT, () => {
    console.log(`Server has started on port ${process.env.API_PORT}`)
})