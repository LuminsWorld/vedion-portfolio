import { getAllCourses } from '../../../lib/courseData'

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  try {
    res.json({ courses: getAllCourses() })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
