const express = require('express')
const router = express.Router()
const pool = require('../db')

router.post('/', async (req, res) => {
    try {
        const { id } = req.body
        const idResponse = await pool.query('INSERT INTO users (user_id) VALUES ($1)', [id])

        res.status(200).send({ message: 'Successfully created a user', response: idResponse.rows })
    } catch (error) {
        console.error(error.message)
        res.status(500).send({ message: 'Internal Server Error' })
    }
})

module.exports = router