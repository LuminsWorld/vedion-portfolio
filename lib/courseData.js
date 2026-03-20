import fs from 'fs'
import path from 'path'

const COURSES_DIR = path.join(process.cwd(), 'content', 'courses')

export function getAllCourses() {
  const files = fs.readdirSync(COURSES_DIR).filter(f => f.endsWith('.json'))
  return files.map(f => {
    const raw  = fs.readFileSync(path.join(COURSES_DIR, f), 'utf8')
    const data = JSON.parse(raw)
    return { id: data.id, title: data.title, description: data.description, moduleCount: data.modules?.length ?? 0 }
  })
}

export function getCourse(courseId) {
  const file = path.join(COURSES_DIR, `${courseId}.json`)
  if (!fs.existsSync(file)) return null
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

export function getModule(courseId, moduleId) {
  const course = getCourse(courseId)
  if (!course) return null
  return course.modules.find(m => m.id === moduleId) ?? null
}
