const express = require('express')
const router = express.Router()
const pool = require('../db')

router.get('/:id', async (req, res) => {
    const { id } = req.params
    const ids = id.split(',').map(Number)
    try {
        const query = 'SELECT * FROM applications WHERE connection_id = ANY($1::INT[])'
        const values = [ids]
        const response = await pool.query(query, values)

        if (response.rows.length === 0) {
            res.status(404).send({ message: 'Applications not found' })
            return
        }

        res.status(200).send({ applications: response.rows })
    } catch (error) {
        console.error('Error fetching applications: ', error)
    }
})

router.get('/for-client/:id', async (req, res) => {
    const { id } = req.params
    try {
        const query = 'SELECT a.*, r.* FROM applications a LEFT JOIN reservations r ON a.application_id = r.application_id WHERE a.coach_id IN (SELECT coach_id FROM connections WHERE client_id = $1)'
        const response = await pool.query(query, [id])

        if (response.rows.length === 0) {
            res.status(404).send({ message: 'Applications or/and Reservations not found' })
            return
        }

        res.status(200).send({ results: response.rows })
    } catch (error) {
        console.debug('Error fetching applications & reservations for client: ', error)
    }
})

router.post('/accept', async (req, res) => {
    const { application_id, application_status, date_time } = req.body
    try {
        await pool.query('UPDATE applications SET application_status = $1 WHERE application_id = $2 RETURNING *', [application_status, application_id])

        if (application_status === 'accepted') {
            await pool.query('INSERT INTO reservations (application_id, date_time) VALUES ($1, $2)', [application_id, date_time])
        }

        res.status(200).send({ message: 'Successfully accepted application' })
    } catch (error) {
        console.error('Error creating application: ', error)
    }
})

router.post('/accept-modify', async (req, res) => {
    const { application_id, application_status } = req.body
    try {
        const applicationQuery = `
            UPDATE applications
            SET
                application_status = $1,
                application_time = application_modify_time
            WHERE application_id = $2
        `
        await pool.query(applicationQuery, [application_status, application_id])

        const reservationQuery = `
            UPDATE reservations
            SET date_time = (
                SELECT application_modify_time
                FROM applications
                WHERE application_id = $1
            )
            WHERE application_id = $1
        `
        await pool.query(reservationQuery, [application_id])

        res.status(200).send({ message: 'Successfully accepted modify application' })
    } catch (error) {
        console.error('Error creating application: ', error)
    }
})

router.post('/accept-cancel', async (req, res) => {
    const { application_id, application_status } = req.body
    try {
        await pool.query('DELETE FROM reservations WHERE application_id = $1', [application_id])

        await pool.query('UPDATE applications SET application_status = $1 WHERE application_id = $2', [application_status, application_id])
        await pool.query('DELETE FROM applications WHERE application_type = $1 AND application_status = $2', ['cancel', 'accepted'])

        res.status(200).send({ message: 'Successfully accepted cancel application' })
    } catch (error) {
        console.error('Error creating application: ', error)
    }
})

router.post('/reject', async (req, res) => {
    const { application_id, application_status } = req.body
    try {
        await pool.query('UPDATE applications SET application_status = $1 WHERE application_id = $2', [application_status, application_id])
        await pool.query('DELETE FROM applications WHERE application_status = $1 AND application_type = $2', ['rejected', 'reservation'])

        res.status(200).send({ message: 'Successfully rejected application' })
    } catch (error) {
        console.error('Error rejecting application: ', error)
    }
})

router.delete('/:id', async (req, res) => {
    const { id } = req.params
    try {
        await pool.query('DELETE FROM applications WHERE application_id = $1', [id])

        res.status(200).send({ message: 'Successfully deleted application' })
    } catch (error) {
        console.error('Error deleting application: ', error)
    }
})

router.delete('/cancel/:id', async (req, res) => {
    const { id } = req.params
    console.log(id)
    try {
        const query = `
            DELETE FROM applications
            WHERE application_id = (
                SELECT application_id
                FROM reservations
                WHERE reservation_id = $1
            )
        `
        await pool.query(query, [id])

        res.status(200).send({ message: 'Successfully canceled reservation' })
    } catch (error) {
        console.error('Error canceling application: ', error)
    }
})


module.exports = router