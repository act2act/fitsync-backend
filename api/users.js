const express = require('express')
const router = express.Router()
const pool = require('../db')
const generator = require('generate-password')

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const userResponse = await pool.query('SELECT * FROM users WHERE user_id = $1', [id])

        res.status(200).send({ message: 'Successfully found the user', response: userResponse.rows[0] })
    } catch (error) {
        console.error('Error finding the user: ', error)
    }
})

router.post('/type-select', async (req, res) => {
    try {
        const { id, type } = req.body
        await pool.query('UPDATE users SET type = $1 WHERE user_id = $2', [type, id])

        // Generate a random code for the coach e.g. A1B9
        let code = generator.generate({
            length: 4,
            numbers: true
        })
        
        if (type === 'coach') {
            await pool.query('INSERT INTO coaches (coach_id, coach_code) VALUES ($1, $2)', [id, code])
        } else if (type === 'client') {
            await pool.query('INSERT INTO clients (client_id) VALUES ($1)', [id])
        } else {
            throw new Error('Invalid user type')
        }
        
        res.status(200).send({ message: 'Successfully update the user type and create a corresponding table'})
    } catch (error) {
        console.error('Error updating the user type: ', error)
    }
})

router.put('/set-name', async (req, res) => {
    const { id, type, name } = req.body
    try {
        if (type === 'coach') {
            await pool.query('UPDATE coaches SET coach_name = $1 WHERE coach_id = $2', [name, id])
        } else if (type === 'client') {
            await pool.query('UPDATE clients SET client_name = $1 WHERE client_id = $2', [name, id])
        }

        res.status(200).send({ message: 'Successfully updated the user name' })
    } catch (error) {
        console.error('Error updating the user: ', error)
    }
})

module.exports = router