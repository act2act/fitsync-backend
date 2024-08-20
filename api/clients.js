const express = require('express')
const router = express.Router()
const pool = require('../db')

// Find clients by id
router.get('/:id', async (req, res) => {
    const { id } = req.params
    const ids = id.split(',').map(Number)
    try {
        const response = await pool.query('SELECT * FROM clients WHERE client_id = ANY($1::BIGINT[])', [ids])

        if (response.rows.length === 0) {
            res.status(404).send({ message: 'Client not found' })
            return
        }

        res.status(200).send({ client: response.rows })
    } catch (error) {
        console.error('Error finding the client: ', error)
    }
})

// Personal Info
router.put('/:id/info', async (req, res) => {
    const { id } = req.params
    const { goal } = req.body
    try {
        await pool.query('UPDATE clients SET goal = $1 WHERE client_id = $2', [goal, id])

        res.status(200).send({ message: 'Successfully updated personal info' })
    } catch (error) {
        console.error('Error updating personal info: ', error)
    }
})

// Personal Schedule
router.get('/:id/personal-schedule', async (req, res) => {
    const { id } = req.params
    try {
        const query = 'SELECT * FROM client_schedules WHERE client_id = $1'
        const response = await pool.query(query, [id])

        res.status(200).send({ schedule: response.rows })
    } catch (error) {
        console.log('Error fetching personal schedule: ', error)
    }
})

router.post('/:id/personal-schedule', async (req, res) => {
    const { id } = req.params
    const { startTime, endTime, content } = req.body

    try {
        const query = 'INSERT INTO client_schedules (client_id, start_time, end_time, content) VALUES ($1, $2, $3, $4)' 
        await pool.query(query, [id, startTime, endTime, content])

        res.status(200).send({ message: 'Successfully saved personal schedule' })
    } catch (error) {
        console.log('Error saving personal schedule: ', error)
    }
})

router.delete('/:id/personal-schedule', async (req, res) => {
    const { id } = req.params
    const { scheduleId } = req.body

    console.log(id, scheduleId)
    try {
        const query = 'DELETE FROM client_schedules WHERE client_id = $1 AND schedule_id = $2'
        await pool.query(query, [id, scheduleId])

        res.status(200).send({ message: 'Successfully deleted personal schedule' })
    } catch (error) {
        console.log('Error deleting personal schedule: ', error)
    }
})

// Application

router.post('/apply', async (req, res) => {
    const { connection_id, direction, application_type, application_time, coach_id } = req.body
    try {
        const checkResponse = await pool.query('SELECT application_status FROM applications WHERE connection_id = $1 AND application_time = $2', [connection_id, application_time])
        if (checkResponse.rows.length > 0 && checkResponse.rows[0].application_status === 'rejected') {
            await pool.query('UPDATE applications SET application_status = $1 WHERE connection_id = $2 AND application_time = $3', ['pending', connection_id, application_time])
        } else {
            await pool.query('INSERT INTO applications (connection_id, direction, application_type, application_time, coach_id) VALUES ($1, $2, $3, $4, $5)', [connection_id, direction, application_type, application_time, coach_id])
        }

        res.status(200).send({ message: 'Successfully applied for the reservation' })
    } catch (error) {
        console.error('Error applying reservation: ', error)
    }
})

// Sign out
router.delete('/:id/sign-out', async (req, res) => {
    const { id } = req.params
    try {
        await pool.query('DELETE FROM client_schedules WHERE client_id = $1', [id])
        await pool.query('DELETE FROM connections WHERE client_id = $1', [id])
        await pool.query('DELETE FROM users WHERE client_id = $1', [id])

        res.status(200).send({ message: 'Successfully signed out' })
    } catch (error) {
        console.error('Error signing out: ', error)
    }
})

module.exports = router