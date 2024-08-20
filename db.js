require('dotenv').config()

const { Pool } = require('pg')

const pool = new Pool({
    user: process.env.USER_NAME,
    password: process.env.USER_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
})

module.exports = pool