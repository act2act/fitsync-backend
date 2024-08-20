const express = require('express')
const router = express.Router()
const pool = require('../db')

router.get('/:id', async (req, res) => {
    const { id } = req.params
    try {
        const query = 'SELECT * FROM connections WHERE client_id = $1 OR coach_id = $1'
        const response = await pool.query(query, [id])

        if (response.rows.length === 0) {
            res.status(404).send({ message: 'Connection not found' })
            return
        }

        res.status(200).send(response.rows)
    } catch (error) {
        console.error('Error finding the connection: ', error)
    }
})

router.post('/', async (req, res) => {
    const { coach_id, client_id } = req.body
    try {
        await pool.query('INSERT INTO connections (coach_id, client_id) VALUES ($1, $2)', [coach_id, client_id])

        res.status(200).send({ message: 'Successfully connected to the coach' })
    } catch (error) {
        console.error('Error connecting to the coach: ', error)
    }
})

router.delete('/:id', async (req, res) => {
    const { id } = req.params
    try {
        pool.query('DELETE FROM connections WHERE client_id = $1', [id])

        res.status(200).send({ message: 'Successfully disconnected from the coach' })
    } catch (error) {
        console.error('Error disconnecting from the coach: ', error)
    }
})

module.exports = router