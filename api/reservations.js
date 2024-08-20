const express = require('express')
const router = express.Router()
const pool = require('../db')

router.get('/', async (req, res) => {
    const { id } = req.query
    const ids = Array.isArray(id) ? id : [id]
    try {
        const response = await pool.query('SELECT * FROM reservations WHERE application_id = ANY($1::INT[])', [ids])

        res.status(200).send({ reservations: response.rows })
    } catch (error) {
        console.error('Error fetching reservations: ', error)
    }
})

router.post('/cancel', async (req, res) => {
    const { application_type, direction, reservation_id } = req.body
    try {
        const query = `
            UPDATE applications
            SET
                application_status = 'pending',
                application_type = CASE
                    WHEN $1 = 'modify' THEN 'modify'
                    WHEN $1 = 'cancel' THEN 'cancel'
                    ELSE application_type
                END,
                direction = CASE
                    WHEN $2 = 'client_to_coach' THEN 'client_to_coach'
                    WHEN $2 = 'coach_to_client' THEN 'coach_to_client'
                    ELSE direction
                END
            WHERE application_id = (
                SELECT application_id
                FROM reservations
                WHERE reservation_id = $3
            )
        `

        await pool.query(query, [application_type, direction, reservation_id])
            
        res.status(200).send({ message: 'Successfully applied cancelling the reservation' })
    } catch (error) {
        console.error('Error canceling reservation: ', error)
    }
})

router.post('/modify', async (req, res) => {
    const { application_type, direction, application_modify_time, reservation_id } = req.body
    try {
        const query = `
            UPDATE applications
            SET
                application_status = 'pending',
                application_type = CASE
                    WHEN $1 = 'modify' THEN 'modify'
                    WHEN $1 = 'cancel' THEN 'cancel'
                    ELSE application_type
                END,
                direction = CASE
                    WHEN $2 = 'client_to_coach' THEN 'client_to_coach'
                    WHEN $2 = 'coach_to_client' THEN 'coach_to_client'
                    ELSE direction
                END,
                application_modify_time = $3
            WHERE application_id = (
                SELECT application_id
                FROM reservations
                WHERE reservation_id = $4
            )
        `

        await pool.query(query, [application_type, direction, application_modify_time, reservation_id])

        res.status(200).send({ message: 'Successfully applied modifying the reservation' })
    } catch (error) {
        console.error('Error modifying reservation: ', error)
    }
})

router.delete('/:id', async (req, res) => {
    const { id } = req.params
    try {
        await pool.query('DELETE FROM reservations WHERE reservation_id = $1', [id])

        res.status(200).send({ message: 'Successfully deleted reservation' })
    } catch (error) {
        console.error('Error deleting reservation: ', error)
    }
})

module.exports = router