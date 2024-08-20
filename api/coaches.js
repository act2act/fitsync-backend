const express = require('express')
const router = express.Router()
const pool = require('../db')


// Find coach by code
router.get('/:code', async (req, res) => {
    const { code } = req.params
    try {
        const response = await pool.query('SELECT * FROM coaches WHERE coach_code = $1', [code])

        if (response.rows.length === 0) {
            res.status(404).send({ message: 'Coach not found' })
        }

        res.status(200).send({ coach: response.rows[0] })
    } catch (error) {
        console.error('Error finding coach by code: ', error)
    }
})

// Find coach by id
router.get('/:id/find-by-id', async (req, res) => {
    const { id } = req.params
    try {
        const response = await pool.query('SELECT * FROM coaches WHERE coach_id = $1', [id])

        if (response.rows.length === 0) {
            res.status(404).send({ message: 'Coach not found' })
        }

        res.status(200).send({ coach: response.rows[0] })
    } catch (error) {
        console.error('Error finding coach by id: ', error)
    }
})

// Set a modifiable time
router.put('/:id/modifiable-time', async (req, res) => {
    const { id } = req.params
    const { modifiableTime } = req.body
    try {
        await pool.query('UPDATE coaches SET modifiable_time = $1 WHERE coach_id = $2', [modifiableTime, id])

        res.status(200).send({ message: 'Successfully set modifiable time'})
    } catch (error) {
        console.error('Error setting modifiable time: ', error)
    }
})

// Personal Info
router.get('/:id/info', async (req, res) => {
    const { id } = req.params
    try {
        const response = await pool.query('SELECT * FROM coach_profile WHERE coach_id = $1', [id])

        res.status(200).send({ info: response.rows })
    } catch (error) {
        console.error('Error fetching personal info: ', error)
    }
})

router.post('/:id/info', async (req, res) => {
    const { id } = req.params
    const { work_experience, certification } = req.body
    try {
        await pool.query('INSERT INTO coach_profile (coach_id, work_experience, certification) VALUES ($1, $2, $3)', [id, work_experience, certification])

        res.status(200).send({ message: 'Successfully wrote personal information'})
    } catch (error) {
        console.error('Error updating personal info: ', error)
    }
})

router.delete('/:id/info', async (req, res) => {
    const { id } = req.params
    try {
        await pool.query('DELETE FROM coach_profile WHERE coach_id = $1', [id])

        res.status(200).send({ message: 'Successfully deleted personal information'})
    } catch (error) {
        console.error('Error deleting personal info: ', error)
    }
})

// Regular schedule
router.get('/:id/regular-schedule', async (req, res) => {
    const { id } = req.params
    try {
        const response = await pool.query('SELECT * FROM coach_availability WHERE coach_id = $1', [id])

        res.status(200).send({ schedule: response.rows })
    } catch (error) {
        console.error('Error fetching regular schedule: ', error)
    }
})
        
router.post('/:id/regular-schedule', async (req, res) => {
    const { id } = req.params
    const { schedule } = req.body

    const values = schedule.flatMap(s => [id, s.day, s.start, s.end])
    const placeholders = schedule.map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`).join(', ')
    const query = `INSERT INTO coach_availability (coach_id, day_of_week, start_time, end_time) VALUES ${placeholders}`
    try {
        await pool.query(query, values)
        res.status(200).send({ message: 'Successfully saved regular schedule'})
    } catch (error) {
        console.error('Error saving regular schedule: ', error)
    }
})

router.put('/:id/regular-schedule', async (req, res) => {
    const { id } = req.params
    const { schedule } = req.body

    try {
        const deleteQuery = 'DELETE FROM coach_availability WHERE coach_id = $1'
        await pool.query(deleteQuery, [id])

        const values = schedule.map(item => ({
            coach_id: parseInt(id),
            day_of_week: item.day,
            start_time: item.start,
            end_time: item.end
        }));
    
        const insertQuery = `
            INSERT INTO coach_availability (coach_id, day_of_week, start_time, end_time)
            SELECT * FROM json_to_recordset($1::json) AS (coach_id BIGINT, day_of_week INT, start_time TIME, end_time TIME)
        `;

        await pool.query(insertQuery, [JSON.stringify(values)])
        res.status(200).send({ message: 'Successfully modified regular schedule'})
    } catch (error) {
        console.error('Error modifying regular schedule: ', error)
    }
})

// Personal schedule
router.get('/:id/personal-schedule', async (req, res) => {
    const { id } = req.params
    try {
        const response = await pool.query('SELECT * FROM coach_schedules WHERE coach_id = $1', [id])

        res.status(200).send({ schedule: response.rows })
    } catch (error) {
        console.error('Error fetching saved schedule: ', error)
    }
})

router.post('/:id/personal-schedule', async (req, res) => {
    const { id } = req.params
    const { startTime, endTime, content } = req.body

    try {
        const query = 'INSERT INTO coach_schedules (coach_id, start_time, end_time, content) VALUES ($1, $2, $3, $4)'
        await pool.query(query, [id, startTime, endTime, content])
        
        res.status(200).send({ message: 'Successfully saved personal schedule'})
    } catch (error) {
        console.error('Error saving personal schedule: ', error)
    }
})

router.delete('/:id/personal-schedule', async (req, res) => {
    const { id } = req.params
    const { scheduleId } = req.body

    try {
        const query = 'DELETE FROM coach_schedules WHERE coach_id = $1 AND schedule_id = $2'
        await pool.query(query, [id, scheduleId])

        res.status(200).send({ message: 'Successfully deleted personal schedule'})
    } catch (error) {
        console.error('Error deleting personal schedule: ', error)
    }
})

// Sign out
router.delete('/:id/sign-out', async (req, res) => {
    const { id } = req.params
    try {
        await pool.query('DELETE FROM coach_profile WHERE coach_id = $1', [id])
        await pool.query('DELETE FROM coach_schedules WHERE coach_id = $1', [id])
        await pool.query('DELETE FROM coach_availability WHERE coach_id = $1', [id])
        await pool.query('DELETE FROM connections WHERE coach_id = $1', [id])
        await pool.query('DELETE FROM coaches WHERE coach_id = $1', [id])
        await pool.query('DELETE FROM users WHERE coach_id = $1', [id])

        res.status(200).send({ message: 'Successfully signed out' })
    } catch (error) {
        console.error('Error signing out: ', error)
    }
})

module.exports = router