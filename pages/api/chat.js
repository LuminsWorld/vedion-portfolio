export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'No message' });

  try {
    // Forward to OpenClaw via webhook or simple response
    // For now, intelligent static responses with personality
    const responses = {
      default: 'Austin builds clean, functional software. CS student at UW-Madison, works at Cafe Hollander. What do you want to know?',
      skills: 'Python, JavaScript, React, Next.js, data science tools (R, pandas, numpy). Currently deep in CS320 and STAT240.',
      contact: 'Best way to reach Austin is through this portfolio. He will get back to you.',
      projects: 'Check the projects section below. Data science, web development, and a few experiments.',
    };

    const lower = message.toLowerCase();
    let reply = responses.default;
    if (lower.includes('skill') || lower.includes('know') || lower.includes('code')) reply = responses.skills;
    if (lower.includes('contact') || lower.includes('reach') || lower.includes('email')) reply = responses.contact;
    if (lower.includes('project') || lower.includes('work') || lower.includes('built')) reply = responses.projects;

    res.json({ reply });
  } catch (e) {
    res.status(500).json({ reply: 'Something went wrong. Try again.' });
  }
}
