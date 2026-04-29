import { useState, useEffect, useCallback, useRef } from 'react'

/* ─── Topic mapping ─── */
export const QUESTION_TOPICS = {
  'e1-q1':  { module: 'module-2', label: 'Module 2 · Data Structures' },
  'e1-q2':  { module: 'module-1', label: 'Module 1 · Intro R' },
  'e1-q3':  { module: 'module-3', label: 'Module 3 · ggplot2' },
  'e1-q4':  { module: 'module-4', label: 'Module 4 · dplyr' },
  'e1-q5':  { module: 'module-3', label: 'Module 3 · ggplot2' },
  'e1-q6':  { module: 'module-4', label: 'Module 4 · dplyr' },
  'e1-q7':  { module: 'module-5', label: 'Module 5 · Joins & Pivots' },
  'e1-q8':  { module: 'module-5', label: 'Module 5 · Joins & Pivots' },
  'e1-q9':  { module: 'module-2', label: 'Module 2 · Data Structures' },
  'e1-q10': { module: 'module-1', label: 'Module 1 · Intro R' },
  'e1-q11': { module: 'module-4', label: 'Module 4 · dplyr' },
  'e1-q12': { module: 'module-3', label: 'Module 3 · ggplot2' },
  'e1-q13': { module: 'module-5', label: 'Module 5 · Joins & Pivots' },
  'e1-q14': { module: 'module-4', label: 'Module 4 · dplyr' },
  'e1-q15': { module: 'module-2', label: 'Module 2 · Data Structures' },
  'e2-q1':  { module: 'module-6', label: 'Module 6 · Probability' },
  'e2-q2':  { module: 'module-7', label: 'Module 7 · Binomial' },
  'e2-q3':  { module: 'module-8', label: 'Module 8 · Normal Dist.' },
  'e2-q4':  { module: 'module-6', label: 'Module 6 · Probability' },
  'e2-q5':  { module: 'module-7', label: 'Module 7 · Binomial' },
  'e2-q6':  { module: 'module-8', label: 'Module 8 · Normal Dist.' },
  'e2-q7':  { module: 'module-6', label: 'Module 6 · Probability' },
  'e2-q8':  { module: 'module-7', label: 'Module 7 · Binomial' },
  'e2-q9':  { module: 'module-8', label: 'Module 8 · Normal Dist.' },
  'e2-q10': { module: 'module-6', label: 'Module 6 · Probability' },
  'e2-q11': { module: 'module-7', label: 'Module 7 · Binomial' },
  'e2-q12': { module: 'module-8', label: 'Module 8 · Normal Dist.' },
  'e2-q13': { module: 'module-6', label: 'Module 6 · Probability' },
  'e2-q14': { module: 'module-7', label: 'Module 7 · Binomial' },
  'e2-q15': { module: 'module-8', label: 'Module 8 · Normal Dist.' },
  // exam-final-new
  'ef-new-q1':  { module: 'module-9',  label: 'Module 9 · CI & Hypothesis Testing' },
  'ef-new-q2':  { module: 'module-10', label: 'Module 10 · Proportion Inference' },
  'ef-new-q3':  { module: 'module-11', label: 'Module 11 · Single Mean Inference' },
  'ef-new-q4':  { module: 'module-12', label: 'Module 12 · Two-Sample & Paired' },
  'ef-new-q5':  { module: 'module-13', label: 'Module 13 · Linear Regression' },
  'ef-new-q6':  { module: 'module-9',  label: 'Module 9 · CI & Hypothesis Testing' },
  'ef-new-q7':  { module: 'module-10', label: 'Module 10 · Proportion Inference' },
  'ef-new-q8':  { module: 'module-11', label: 'Module 11 · Single Mean Inference' },
  'ef-new-q9':  { module: 'module-12', label: 'Module 12 · Two-Sample & Paired' },
  'ef-new-q10': { module: 'module-13', label: 'Module 13 · Linear Regression' },
  'ef-new-q11': { module: 'module-9',  label: 'Module 9 · CI & Hypothesis Testing' },
  'ef-new-q12': { module: 'module-10', label: 'Module 10 · Proportion Inference' },
  'ef-new-q13': { module: 'module-12', label: 'Module 12 · Two-Sample & Paired' },
  'ef-new-q14': { module: 'module-11', label: 'Module 11 · Single Mean Inference' },
  'ef-new-q15': { module: 'module-13', label: 'Module 13 · Linear Regression' },
  // exam-final
  'ef-q1':  { module: 'module-4', label: 'Module 4 · dplyr' },
  'ef-q2':  { module: 'module-3', label: 'Module 3 · ggplot2' },
  'ef-q3':  { module: 'module-4', label: 'Module 4 · dplyr' },
  'ef-q4':  { module: 'module-5', label: 'Module 5 · Joins & Pivots' },
  'ef-q5':  { module: 'module-7', label: 'Module 7 · Binomial' },
  'ef-q6':  { module: 'module-8', label: 'Module 8 · Normal Dist.' },
  'ef-q7':  { module: 'module-8', label: 'Module 8 · Normal Dist.' },
  'ef-q8':  { module: 'module-9', label: 'Module 9 · CI & Hypothesis Testing' },
  'ef-q9':  { module: 'module-10', label: 'Module 10 · Proportion Inference' },
  'ef-q10': { module: 'module-11', label: 'Module 11 · Single Mean Inference' },
  'ef-q11': { module: 'module-12', label: 'Module 12 · Two-Sample & Paired' },
  'ef-q12': { module: 'module-13', label: 'Module 13 · Linear Regression' },
  'ef-q13': { module: 'module-13', label: 'Module 13 · Linear Regression' },
  'ef-q14': { module: 'module-10', label: 'Module 10 · Proportion Inference' },
  'ef-q15': { module: 'module-5', label: 'Module 5 · Joins & Pivots' },
  'ef-q16': { module: 'module-11', label: 'Module 11 · Single Mean Inference' },
  'ef-q17': { module: 'module-12', label: 'Module 12 · Two-Sample & Paired' },
  'ef-q18': { module: 'module-9',  label: 'Module 9 · CI & Hypothesis Testing' },
  'ef-q19': { module: 'module-10', label: 'Module 10 · Proportion Inference' },
  'ef-q20': { module: 'module-13', label: 'Module 13 · Linear Regression' },
  // All individual module question IDs
  'm1-q1': { module: 'module-1', label: 'Module 1 · Intro R' },
  'm1-q2': { module: 'module-1', label: 'Module 1 · Intro R' },
  'm1-q3': { module: 'module-1', label: 'Module 1 · Intro R' },
  'm1-q4': { module: 'module-1', label: 'Module 1 · Intro R' },
  'm1-q5': { module: 'module-1', label: 'Module 1 · Intro R' },
  'm1-q6': { module: 'module-1', label: 'Module 1 · Intro R' },
  'm1-q7': { module: 'module-1', label: 'Module 1 · Intro R' },
  'm1-sa1': { module: 'module-1', label: 'Module 1 · Intro R' },
  'm1-fb1': { module: 'module-1', label: 'Module 1 · Intro R' },
  'm1-sa2': { module: 'module-1', label: 'Module 1 · Intro R' },
  'm2-q1': { module: 'module-2', label: 'Module 2 · Data Structures' },
  'm2-q2': { module: 'module-2', label: 'Module 2 · Data Structures' },
  'm2-q3': { module: 'module-2', label: 'Module 2 · Data Structures' },
  'm2-q4': { module: 'module-2', label: 'Module 2 · Data Structures' },
  'm2-q5': { module: 'module-2', label: 'Module 2 · Data Structures' },
  'm2-q6': { module: 'module-2', label: 'Module 2 · Data Structures' },
  'm2-q7': { module: 'module-2', label: 'Module 2 · Data Structures' },
  'm2-sa1': { module: 'module-2', label: 'Module 2 · Data Structures' },
  'm2-fb1': { module: 'module-2', label: 'Module 2 · Data Structures' },
  'm2-sa2': { module: 'module-2', label: 'Module 2 · Data Structures' },
  'm2-fb2': { module: 'module-2', label: 'Module 2 · Data Structures' },
  'm3-q1': { module: 'module-3', label: 'Module 3 · ggplot2' },
  'm3-q2': { module: 'module-3', label: 'Module 3 · ggplot2' },
  'm3-q3': { module: 'module-3', label: 'Module 3 · ggplot2' },
  'm3-q4': { module: 'module-3', label: 'Module 3 · ggplot2' },
  'm3-q5': { module: 'module-3', label: 'Module 3 · ggplot2' },
  'm3-q6': { module: 'module-3', label: 'Module 3 · ggplot2' },
  'm3-q7': { module: 'module-3', label: 'Module 3 · ggplot2' },
  'm3-sa1': { module: 'module-3', label: 'Module 3 · ggplot2' },
  'm3-fb1': { module: 'module-3', label: 'Module 3 · ggplot2' },
  'm3-sa2': { module: 'module-3', label: 'Module 3 · ggplot2' },
  'm4-q1': { module: 'module-4', label: 'Module 4 · dplyr' },
  'm4-q2': { module: 'module-4', label: 'Module 4 · dplyr' },
  'm4-q3': { module: 'module-4', label: 'Module 4 · dplyr' },
  'm4-q4': { module: 'module-4', label: 'Module 4 · dplyr' },
  'm4-q5': { module: 'module-4', label: 'Module 4 · dplyr' },
  'm4-q6': { module: 'module-4', label: 'Module 4 · dplyr' },
  'm4-q7': { module: 'module-4', label: 'Module 4 · dplyr' },
  'm4-sa1': { module: 'module-4', label: 'Module 4 · dplyr' },
  'm4-fb1': { module: 'module-4', label: 'Module 4 · dplyr' },
  'm4-sa2': { module: 'module-4', label: 'Module 4 · dplyr' },
  'm5-q1': { module: 'module-5', label: 'Module 5 · Joins & Pivots' },
  'm5-q2': { module: 'module-5', label: 'Module 5 · Joins & Pivots' },
  'm5-q3': { module: 'module-5', label: 'Module 5 · Joins & Pivots' },
  'm5-q4': { module: 'module-5', label: 'Module 5 · Joins & Pivots' },
  'm5-q5': { module: 'module-5', label: 'Module 5 · Joins & Pivots' },
  'm5-q6': { module: 'module-5', label: 'Module 5 · Joins & Pivots' },
  'm5-q7': { module: 'module-5', label: 'Module 5 · Joins & Pivots' },
  'm5-sa1': { module: 'module-5', label: 'Module 5 · Joins & Pivots' },
  'm5-fb1': { module: 'module-5', label: 'Module 5 · Joins & Pivots' },
  'm5-sa2': { module: 'module-5', label: 'Module 5 · Joins & Pivots' },
  'm6-q1': { module: 'module-6', label: 'Module 6 · Probability' },
  'm6-q2': { module: 'module-6', label: 'Module 6 · Probability' },
  'm6-q3': { module: 'module-6', label: 'Module 6 · Probability' },
  'm6-q4': { module: 'module-6', label: 'Module 6 · Probability' },
  'm6-q5': { module: 'module-6', label: 'Module 6 · Probability' },
  'm6-q6': { module: 'module-6', label: 'Module 6 · Probability' },
  'm6-q7': { module: 'module-6', label: 'Module 6 · Probability' },
  'm6-q8': { module: 'module-6', label: 'Module 6 · Probability' },
  'm6-q9': { module: 'module-6', label: 'Module 6 · Probability' },
  'm6-q10': { module: 'module-6', label: 'Module 6 · Probability' },
  'm7-q1': { module: 'module-7', label: 'Module 7 · Binomial' },
  'm7-q2': { module: 'module-7', label: 'Module 7 · Binomial' },
  'm7-q3': { module: 'module-7', label: 'Module 7 · Binomial' },
  'm7-q4': { module: 'module-7', label: 'Module 7 · Binomial' },
  'm7-q5': { module: 'module-7', label: 'Module 7 · Binomial' },
  'm7-q6': { module: 'module-7', label: 'Module 7 · Binomial' },
  'm7-q7': { module: 'module-7', label: 'Module 7 · Binomial' },
  'm7-q8': { module: 'module-7', label: 'Module 7 · Binomial' },
  'm7-q9': { module: 'module-7', label: 'Module 7 · Binomial' },
  'm7-q10': { module: 'module-7', label: 'Module 7 · Binomial' },
  'm8-q1': { module: 'module-8', label: 'Module 8 · Normal Dist.' },
  'm8-q2': { module: 'module-8', label: 'Module 8 · Normal Dist.' },
  'm8-q3': { module: 'module-8', label: 'Module 8 · Normal Dist.' },
  'm8-q4': { module: 'module-8', label: 'Module 8 · Normal Dist.' },
  'm8-q5': { module: 'module-8', label: 'Module 8 · Normal Dist.' },
  'm8-q6': { module: 'module-8', label: 'Module 8 · Normal Dist.' },
  'm8-q7': { module: 'module-8', label: 'Module 8 · Normal Dist.' },
  'm8-q8': { module: 'module-8', label: 'Module 8 · Normal Dist.' },
  'm8-q9': { module: 'module-8', label: 'Module 8 · Normal Dist.' },
  'm8-q10': { module: 'module-8', label: 'Module 8 · Normal Dist.' },
  'm9-q1': { module: 'module-9', label: 'Module 9 · CI & Hypothesis Testing' },
  'm9-q2': { module: 'module-9', label: 'Module 9 · CI & Hypothesis Testing' },
  'm9-q3': { module: 'module-9', label: 'Module 9 · CI & Hypothesis Testing' },
  'm9-q4': { module: 'module-9', label: 'Module 9 · CI & Hypothesis Testing' },
  'm9-q5': { module: 'module-9', label: 'Module 9 · CI & Hypothesis Testing' },
  'm9-q6': { module: 'module-9', label: 'Module 9 · CI & Hypothesis Testing' },
  'm9-q7': { module: 'module-9', label: 'Module 9 · CI & Hypothesis Testing' },
  'm9-q8': { module: 'module-9', label: 'Module 9 · CI & Hypothesis Testing' },
  'm9-q9': { module: 'module-9', label: 'Module 9 · CI & Hypothesis Testing' },
  'm9-q10': { module: 'module-9', label: 'Module 9 · CI & Hypothesis Testing' },
  'm10-q1': { module: 'module-10', label: 'Module 10 · Proportion Inference' },
  'm10-q2': { module: 'module-10', label: 'Module 10 · Proportion Inference' },
  'm10-q3': { module: 'module-10', label: 'Module 10 · Proportion Inference' },
  'm10-q4': { module: 'module-10', label: 'Module 10 · Proportion Inference' },
  'm10-q5': { module: 'module-10', label: 'Module 10 · Proportion Inference' },
  'm10-q6': { module: 'module-10', label: 'Module 10 · Proportion Inference' },
  'm10-q7': { module: 'module-10', label: 'Module 10 · Proportion Inference' },
  'm10-q8': { module: 'module-10', label: 'Module 10 · Proportion Inference' },
  'm10-q9': { module: 'module-10', label: 'Module 10 · Proportion Inference' },
  'm10-q10': { module: 'module-10', label: 'Module 10 · Proportion Inference' },
  'm11-q1': { module: 'module-11', label: 'Module 11 · Single Mean Inference' },
  'm11-q2': { module: 'module-11', label: 'Module 11 · Single Mean Inference' },
  'm11-q3': { module: 'module-11', label: 'Module 11 · Single Mean Inference' },
  'm11-q4': { module: 'module-11', label: 'Module 11 · Single Mean Inference' },
  'm11-q5': { module: 'module-11', label: 'Module 11 · Single Mean Inference' },
  'm11-q6': { module: 'module-11', label: 'Module 11 · Single Mean Inference' },
  'm11-q7': { module: 'module-11', label: 'Module 11 · Single Mean Inference' },
  'm11-q8': { module: 'module-11', label: 'Module 11 · Single Mean Inference' },
  'm11-q9': { module: 'module-11', label: 'Module 11 · Single Mean Inference' },
  'm11-q10': { module: 'module-11', label: 'Module 11 · Single Mean Inference' },
  'm12-q1': { module: 'module-12', label: 'Module 12 · Two-Sample & Paired' },
  'm12-q2': { module: 'module-12', label: 'Module 12 · Two-Sample & Paired' },
  'm12-q3': { module: 'module-12', label: 'Module 12 · Two-Sample & Paired' },
  'm12-q4': { module: 'module-12', label: 'Module 12 · Two-Sample & Paired' },
  'm12-q5': { module: 'module-12', label: 'Module 12 · Two-Sample & Paired' },
  'm12-q6': { module: 'module-12', label: 'Module 12 · Two-Sample & Paired' },
  'm12-q7': { module: 'module-12', label: 'Module 12 · Two-Sample & Paired' },
  'm12-q8': { module: 'module-12', label: 'Module 12 · Two-Sample & Paired' },
  'm12-q9': { module: 'module-12', label: 'Module 12 · Two-Sample & Paired' },
  'm12-q10': { module: 'module-12', label: 'Module 12 · Two-Sample & Paired' },
  'm13-q1': { module: 'module-13', label: 'Module 13 · Linear Regression' },
  'm13-q2': { module: 'module-13', label: 'Module 13 · Linear Regression' },
  'm13-q3': { module: 'module-13', label: 'Module 13 · Linear Regression' },
  'm13-q4': { module: 'module-13', label: 'Module 13 · Linear Regression' },
  'm13-q5': { module: 'module-13', label: 'Module 13 · Linear Regression' },
  'm13-q6': { module: 'module-13', label: 'Module 13 · Linear Regression' },
  'm13-q7': { module: 'module-13', label: 'Module 13 · Linear Regression' },
  'm13-q8': { module: 'module-13', label: 'Module 13 · Linear Regression' },
  'm13-q9': { module: 'module-13', label: 'Module 13 · Linear Regression' },
  'm13-q10': { module: 'module-13', label: 'Module 13 · Linear Regression' },
  // QA flashcards (term/definition style)
  'm1-fc1': { module: 'module-1', label: 'Module 1 · Intro R' },
  'm1-fc2': { module: 'module-1', label: 'Module 1 · Intro R' },
  'm1-fc3': { module: 'module-1', label: 'Module 1 · Intro R' },
  'm2-fc1': { module: 'module-2', label: 'Module 2 · Data Structures' },
  'm2-fc2': { module: 'module-2', label: 'Module 2 · Data Structures' },
  'm2-fc3': { module: 'module-2', label: 'Module 2 · Data Structures' },
  'm3-fc1': { module: 'module-3', label: 'Module 3 · ggplot2' },
  'm3-fc2': { module: 'module-3', label: 'Module 3 · ggplot2' },
  'm3-fc3': { module: 'module-3', label: 'Module 3 · ggplot2' },
  'm4-fc1': { module: 'module-4', label: 'Module 4 · dplyr' },
  'm4-fc2': { module: 'module-4', label: 'Module 4 · dplyr' },
  'm4-fc3': { module: 'module-4', label: 'Module 4 · dplyr' },
  'm5-fc1': { module: 'module-5', label: 'Module 5 · Joins & Pivots' },
  'm5-fc2': { module: 'module-5', label: 'Module 5 · Joins & Pivots' },
  'm5-fc3': { module: 'module-5', label: 'Module 5 · Joins & Pivots' },
  'm6-fc1': { module: 'module-6', label: 'Module 6 · Probability' },
  'm6-fc2': { module: 'module-6', label: 'Module 6 · Probability' },
  'm6-fc3': { module: 'module-6', label: 'Module 6 · Probability' },
  'm7-fc1': { module: 'module-7', label: 'Module 7 · Binomial' },
  'm7-fc2': { module: 'module-7', label: 'Module 7 · Binomial' },
  'm7-fc3': { module: 'module-7', label: 'Module 7 · Binomial' },
  'm8-fc1': { module: 'module-8', label: 'Module 8 · Normal Dist.' },
  'm8-fc2': { module: 'module-8', label: 'Module 8 · Normal Dist.' },
  'm8-fc3': { module: 'module-8', label: 'Module 8 · Normal Dist.' },
  'm9-fc1': { module: 'module-9', label: 'Module 9 · CI & Hypothesis Testing' },
  'm9-fc2': { module: 'module-9', label: 'Module 9 · CI & Hypothesis Testing' },
  'm9-fc3': { module: 'module-9', label: 'Module 9 · CI & Hypothesis Testing' },
  'm10-fc1': { module: 'module-10', label: 'Module 10 · Proportion Inference' },
  'm10-fc2': { module: 'module-10', label: 'Module 10 · Proportion Inference' },
  'm10-fc3': { module: 'module-10', label: 'Module 10 · Proportion Inference' },
  'm11-fc1': { module: 'module-11', label: 'Module 11 · Single Mean Inference' },
  'm11-fc2': { module: 'module-11', label: 'Module 11 · Single Mean Inference' },
  'm11-fc3': { module: 'module-11', label: 'Module 11 · Single Mean Inference' },
  'm12-fc1': { module: 'module-12', label: 'Module 12 · Two-Sample & Paired' },
  'm12-fc2': { module: 'module-12', label: 'Module 12 · Two-Sample & Paired' },
  'm12-fc3': { module: 'module-12', label: 'Module 12 · Two-Sample & Paired' },
  'm13-fc1': { module: 'module-13', label: 'Module 13 · Linear Regression' },
  'm13-fc2': { module: 'module-13', label: 'Module 13 · Linear Regression' },
  'm13-fc3': { module: 'module-13', label: 'Module 13 · Linear Regression' },
}

/* ─── Algorithm: weighted SM-2-inspired ─── */
function initDeck(questions, savedProgress) {
  const weights     = savedProgress?.weights      ?? {}
  const consec      = savedProgress?.consecutive  ?? {}
  const masteredSet = new Set(savedProgress?.mastered ?? [])
  return questions.map(q => ({
    ...q,
    weight:     weights[q.id]  ?? 1.0,
    consecutive: consec[q.id] ?? 0,
    mastered:   masteredSet.has(q.id),
    moduleSource: QUESTION_TOPICS[q.id]?.module ?? q.moduleId ?? 'unknown',
  }))
}

function pickNext(deck) {
  const active = deck.filter(c => !c.mastered)
  if (active.length === 0) return null
  const total = active.reduce((s, c) => s + c.weight, 0)
  let r = Math.random() * total
  for (const c of active) { r -= c.weight; if (r <= 0) return c }
  return active[active.length - 1]
}

function applyResult(deck, cardId, correct) {
  const card = deck.find(c => c.id === cardId)
  return deck.map(c => {
    if (c.id === cardId) {
      const newConsec  = correct ? c.consecutive + 1 : 0
      const newMastered = newConsec >= 3
      const newWeight  = correct
        ? Math.max(0.1, c.weight * 0.6)
        : Math.min(10,  c.weight * 2.5)
      return { ...c, weight: newWeight, consecutive: newConsec, mastered: newMastered }
    }
    // Same-module bump on wrong answer
    if (!correct && card && c.moduleSource === card.moduleSource) {
      return { ...c, weight: Math.min(10, c.weight * 1.3) }
    }
    return c
  })
}

function serializeProgress(deck, sessionCount) {
  const weights = {}; const consecutive = {}; const mastered = []
  deck.forEach(c => {
    weights[c.id] = c.weight
    consecutive[c.id] = c.consecutive
    if (c.mastered) mastered.push(c.id)
  })
  return { weights, consecutive, mastered, sessionCount, lastSession: Date.now() }
}

/* ─── R syntax highlighter ─── */
function highlightR(code) {
  let out = code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  out = out.replace(/(#[^\n]*)/g,'<span style="color:#5a6a5a;font-style:italic">$1</span>')
  out = out.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,'<span style="color:#ce9178">$1</span>')
  out = out.replace(/\b(function|if|else|for|while|return|library|TRUE|FALSE|NA|NULL|NaN|Inf|in)\b/g,'<span style="color:#c586c0;font-weight:600">$1</span>')
  out = out.replace(/\b(\d+\.?\d*)\b/g,'<span style="color:#b5cea8">$1</span>')
  out = out.replace(/(<-|->|==|!=|>=|<=|%>%|\|>|%%|%in%)/g,'<span style="color:#569cd6">$1</span>')
  return out
}

/* ─── Overline render (x-bar, y-bar, d-bar via CSS) ─── */
function renderOverline(str) {
  const MAP = { 'x̄': 'x', 'ȳ': 'y', 'd̄': 'd' }
  return str.split(/(x̄|ȳ|d̄)/g).map((tok, i) =>
    MAP[tok]
      ? <span key={i} style={{ textDecoration: 'overline', textDecorationColor: 'currentcolor' }}>{MAP[tok]}</span>
      : tok
  )
}

/* ─── Inline text renderer ─── */
function InlineText({ text }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`'))
          return <code key={i} style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'0.88em', background:'rgba(255,255,255,0.08)', padding:'2px 6px', borderRadius:4, color:'#ce9178' }}>{part.slice(1,-1)}</code>
        if (part.startsWith('**') && part.endsWith('**'))
          return <strong key={i} style={{ color:'#fff', fontWeight:700 }}>{renderOverline(part.slice(2,-2))}</strong>
        if (part.startsWith('*') && part.endsWith('*'))
          return <em key={i} style={{ fontStyle:'italic', color:'rgba(255,255,255,0.85)' }}>{renderOverline(part.slice(1,-1))}</em>
        return <span key={i}>{renderOverline(part)}</span>
      })}
    </>
  )
}

/* ─── Grade helpers ─── */
function gradeMultiple(q, selected) {
  return selected === q.answer
}
function gradeSelectAll(q, selected) {
  const correct = [...(q.answer ?? [])].sort().join(',')
  const given   = [...selected].sort().join(',')
  return correct === given
}
function gradeFillBlank(q, text) {
  const t = text.trim().toLowerCase().replace(/\s+/g,' ')
  return (q.blanks ?? []).some(b => b.trim().toLowerCase().replace(/\s+/g,' ') === t)
}

/* ─── Topic label ─── */
function getTopicLabel(q) {
  return QUESTION_TOPICS[q.id]?.label ?? q.moduleId ?? 'Flashcard'
}

/* ─── Summary helpers ─── */
function buildTopicSummary(deck) {
  const topics = {}
  deck.forEach(c => {
    const label = QUESTION_TOPICS[c.id]?.label ?? c.moduleId ?? 'Unknown'
    if (!topics[label]) topics[label] = { weight: 0, count: 0, mastered: 0 }
    topics[label].weight += c.weight
    topics[label].count++
    if (c.mastered) topics[label].mastered++
  })
  return Object.entries(topics).map(([label, d]) => ({
    label,
    avgWeight: d.weight / d.count,
    mastered: d.mastered,
    total: d.count,
  })).sort((a, b) => b.avgWeight - a.avgWeight)
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */
export default function FlashcardStudy({ questions, courseId, moduleId, progress: savedProgress, onSaveProgress, onClose }) {
  const [phase, setPhase]           = useState('start')   // start | card | complete
  const [deck, setDeck]             = useState([])
  const [currentCard, setCurrentCard] = useState(null)
  const [sessionCount, setSessionCount] = useState(savedProgress?.sessionCount ?? 0)
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0, mastered: 0 })

  // Card interaction state
  const [selectedAnswer, setSelectedAnswer]   = useState(null)   // index | int[] | string
  const [checkboxState,  setCheckboxState]    = useState([])
  const [fillInput,      setFillInput]        = useState('')
  const [isFlipped,      setIsFlipped]        = useState(false)
  const [flipAnimating,  setFlipAnimating]    = useState(false)
  const [resultCorrect,  setResultCorrect]    = useState(null)    // true | false | null
  const [overruled,      setOverruled]        = useState(false)
  const [aiExplanation,  setAiExplanation]    = useState(null)
  const [aiLoading,      setAiLoading]        = useState(false)
  const [aiError,        setAiError]          = useState(null)

  // Sync saved progress on prop change
  useEffect(() => {
    if (savedProgress) setSessionCount(savedProgress.sessionCount ?? 0)
  }, [savedProgress])

  /* ─── Start session ─── */
  const startSession = useCallback(() => {
    const newDeck = initDeck(questions, savedProgress)
    const first   = pickNext(newDeck)
    setDeck(newDeck)
    setCurrentCard(first)
    setSessionStats({ correct: 0, wrong: 0, mastered: 0 })
    resetCardState()
    setPhase('card')
  }, [questions, savedProgress])

  function resetCardState() {
    setSelectedAnswer(null)
    setCheckboxState([])
    setFillInput('')
    setIsFlipped(false)
    setFlipAnimating(false)
    setResultCorrect(null)
    setOverruled(false)
    setAiExplanation(null)
    setAiError(null)
  }

  /* ─── Flip the card ─── */
  function doFlip() {
    if (!currentCard) return
    let correct = null
    if (currentCard.type === 'multiple') correct = gradeMultiple(currentCard, selectedAnswer)
    else if (currentCard.type === 'select-all') correct = gradeSelectAll(currentCard, checkboxState)
    else if (currentCard.type === 'fill-blank') correct = gradeFillBlank(currentCard, fillInput)
    else if (currentCard.type === 'qa') correct = null  // self-assessed later

    setResultCorrect(correct)
    setFlipAnimating(true)
    setIsFlipped(true)
    setTimeout(() => setFlipAnimating(false), 580)
  }

  /* ─── Record result and advance ─── */
  const recordResult = useCallback(async (correct) => {
    const newDeck   = applyResult(deck, currentCard.id, correct)
    const newStats  = {
      correct:  sessionStats.correct  + (correct ? 1 : 0),
      wrong:    sessionStats.wrong    + (correct ? 0 : 1),
      mastered: sessionStats.mastered + (newDeck.find(c => c.id === currentCard.id)?.mastered ? 1 : 0),
    }
    const newCount  = sessionCount + 1 / questions.length  // fractional — full session increments by 1
    const active    = newDeck.filter(c => !c.mastered)
    const next      = pickNext(newDeck)

    setDeck(newDeck)
    setSessionStats(newStats)

    const serialized = serializeProgress(newDeck, Math.floor(sessionCount) + (active.length === 0 ? 1 : 0))
    if (onSaveProgress) await onSaveProgress(serialized)

    if (active.length === 0) {
      setSessionCount(sc => Math.floor(sc) + 1)
      setPhase('complete')
      return
    }

    setCurrentCard(next)
    resetCardState()
  }, [deck, currentCard, sessionStats, sessionCount, questions.length, onSaveProgress])

  /* ─── Overrule (fill-blank self-override) ─── */
  function handleOverrule() {
    setOverruled(true)
    setResultCorrect(true)
  }

  /* ─── AI explain ─── */
  async function fetchAiExplain() {
    if (!currentCard || !courseId || !moduleId) return
    setAiLoading(true)
    setAiError(null)
    try {
      const { auth } = await import('../lib/firebase')
      const user = auth.currentUser
      if (!user) { setAiError('Not signed in.'); setAiLoading(false); return }
      const token = await user.getIdToken()

      const wrongText = currentCard.type === 'multiple'   ? (currentCard.options?.[selectedAnswer] ?? String(selectedAnswer))
                      : currentCard.type === 'select-all' ? checkboxState.map(i => currentCard.options?.[i]).join(', ')
                      : currentCard.type === 'fill-blank' ? fillInput
                      : '(self-assessed)'
      const rightText = currentCard.type === 'multiple'   ? (currentCard.options?.[currentCard.answer] ?? '')
                      : currentCard.type === 'select-all' ? (currentCard.answer ?? []).map(i => currentCard.options?.[i]).join(', ')
                      : currentCard.type === 'fill-blank' ? (currentCard.blanks?.[0] ?? '')
                      : (currentCard.back ?? '')

      const res = await fetch('/api/learn/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          courseId,
          moduleId: QUESTION_TOPICS[currentCard.id]?.module ?? moduleId,
          question: currentCard.type === 'qa' ? currentCard.front : currentCard.question,
          wrongAnswer: wrongText,
          correctAnswer: rightText,
        }),
      })
      const data = await res.json()
      if (data.error) setAiError(data.error)
      else setAiExplanation(data.explanation)
    } catch {
      setAiError('Request failed.')
    }
    setAiLoading(false)
  }

  /* ────────────────────────────────────────────────────────
     PHASE: START
     ──────────────────────────────────────────────────────── */
  if (phase === 'start') {
    const previewDeck  = initDeck(questions, savedProgress)
    const topics       = buildTopicSummary(previewDeck)
    const masteredCt   = previewDeck.filter(c => c.mastered).length
    const isFirst      = !savedProgress?.sessionCount

    return (
      <div style={{ padding: '32px 0' }}>
        <button onClick={onClose} style={{ background:'none', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, padding:'6px 14px', fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'rgba(255,255,255,0.35)', cursor:'pointer', letterSpacing:'0.1em', marginBottom:24 }}>
          BACK
        </button>

        <div style={{ textAlign:'center', padding:'32px 0' }}>
          <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'rgba(255,255,255,0.3)', letterSpacing:'0.2em', marginBottom:12 }}>FLASHCARD STUDY</div>
          <div style={{ fontFamily:'Inter,sans-serif', fontWeight:900, fontSize:'clamp(1.4rem,4vw,2rem)', marginBottom:8 }}>
            {isFirst ? 'First Session' : `Session #${(savedProgress?.sessionCount ?? 0) + 1}`}
          </div>
          <div style={{ color:'rgba(255,255,255,0.4)', fontSize:13, marginBottom:28 }}>
            {questions.length} cards total{masteredCt > 0 ? ` · ${masteredCt} mastered` : ''} · 3 correct in a row to master a card
          </div>

          {/* Topic breakdown */}
          <div style={{ maxWidth:420, margin:'0 auto 32px', textAlign:'left' }}>
            {topics.map(t => {
              const pct = t.mastered / t.total
              const color = pct === 1 ? '#00FF41' : t.avgWeight > 2.5 ? '#FF2D55' : t.avgWeight > 1.5 ? '#FFB800' : '#00FF41'
              return (
                <div key={t.label} style={{ display:'flex', alignItems:'center', gap:10, padding:'5px 0' }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:color, flexShrink:0 }} />
                  <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'rgba(255,255,255,0.55)', flex:1 }}>{t.label}</span>
                  {t.mastered > 0 && <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'rgba(0,255,65,0.6)' }}>{t.mastered}/{t.total} mastered</span>}
                </div>
              )
            })}
          </div>

          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={startSession} style={{ background:'#00FF41', color:'#000', border:'none', borderRadius:6, padding:'14px 36px', fontFamily:'JetBrains Mono,monospace', fontWeight:900, fontSize:14, cursor:'pointer', letterSpacing:'0.08em' }}>
              START STUDYING
            </button>
            {savedProgress && (
              <button onClick={async () => { await onSaveProgress?.({ weights:{}, consecutive:{}, mastered:[], sessionCount:0 }); window.location.reload() }}
                style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.3)', borderRadius:6, padding:'14px 24px', fontFamily:'JetBrains Mono,monospace', fontSize:12, cursor:'pointer' }}>
                RESET PROGRESS
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ────────────────────────────────────────────────────────
     PHASE: COMPLETE
     ──────────────────────────────────────────────────────── */
  if (phase === 'complete') {
    const topics = buildTopicSummary(deck)
    return (
      <div style={{ padding:'32px 0' }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'#00FF41', letterSpacing:'0.25em', marginBottom:12 }}>ALL CARDS MASTERED</div>
          <div style={{ fontFamily:'Inter,sans-serif', fontWeight:900, fontSize:'clamp(1.6rem,4vw,2.2rem)', marginBottom:20 }}>Session Complete</div>
          <div style={{ display:'flex', justifyContent:'center', gap:28, flexWrap:'wrap' }}>
            {[['CORRECT', sessionStats.correct, '#00FF41'],['WRONG', sessionStats.wrong,'#FF2D55'],['MASTERED',sessionStats.mastered,'#A855F7']].map(([label,val,color])=>(
              <div key={label} style={{ textAlign:'center' }}>
                <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:28, fontWeight:700, color }}>{val}</div>
                <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:9, color:'rgba(255,255,255,0.35)', letterSpacing:'0.1em' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:32, border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, overflow:'hidden' }}>
          <div style={{ padding:'10px 16px', background:'rgba(255,255,255,0.02)', borderBottom:'1px solid rgba(255,255,255,0.05)', fontFamily:'JetBrains Mono,monospace', fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:'0.15em' }}>TOPIC BREAKDOWN</div>
          {topics.map(t => {
            const color = t.mastered === t.total ? '#00FF41' : t.avgWeight > 2 ? '#FF2D55' : '#FFB800'
            return (
              <div key={t.label} style={{ display:'flex', alignItems:'center', padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                <span style={{ flex:1, fontFamily:'JetBrains Mono,monospace', fontSize:12, color:'rgba(255,255,255,0.6)' }}>{t.label}</span>
                <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color, background:color+'15', border:`1px solid ${color}33`, padding:'2px 10px', borderRadius:4 }}>
                  {t.mastered === t.total ? 'MASTERED' : t.avgWeight > 2 ? 'NEEDS WORK' : 'REVIEW'}
                </span>
              </div>
            )
          })}
        </div>

        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          <button onClick={() => { startSession() }} style={{ background:'#00FF41', color:'#000', border:'none', borderRadius:6, padding:'12px 28px', fontFamily:'JetBrains Mono,monospace', fontWeight:900, fontSize:12, cursor:'pointer', letterSpacing:'0.08em' }}>STUDY AGAIN</button>
          <button onClick={onClose} style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.4)', borderRadius:6, padding:'12px 24px', fontFamily:'JetBrains Mono,monospace', fontSize:11, cursor:'pointer' }}>BACK</button>
        </div>
      </div>
    )
  }

  /* ────────────────────────────────────────────────────────
     PHASE: CARD
     ──────────────────────────────────────────────────────── */
  if (!currentCard) return null
  const q         = currentCard
  const topicLabel = getTopicLabel(q)
  const activeCt  = deck.filter(c => !c.mastered).length
  const masteredCt = deck.filter(c => c.mastered).length
  const totalCt   = deck.length
  const progressPct = (masteredCt / totalCt) * 100

  // Can the user flip?
  const canFlip = q.type === 'qa'
    || (q.type === 'multiple'  && selectedAnswer !== null)
    || (q.type === 'select-all' && checkboxState.length > 0)
    || (q.type === 'fill-blank' && fillInput.trim().length > 0)

  // Effective correct (after overrule)
  const effectiveCorrect = overruled ? true : resultCorrect

  return (
    <div style={{ padding:'32px 0' }}>
      {/* Progress bar */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <div style={{ flex:1, height:4, background:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', background:'#00FF41', width:`${progressPct}%`, transition:'width 0.4s ease', borderRadius:2 }} />
        </div>
        <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'rgba(255,255,255,0.3)', whiteSpace:'nowrap' }}>
          {masteredCt}/{totalCt} mastered
        </span>
      </div>

      {/* Topic tag */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:9, color:'rgba(0,255,65,0.5)', background:'rgba(0,255,65,0.05)', border:'1px solid rgba(0,255,65,0.15)', padding:'3px 10px', borderRadius:4, letterSpacing:'0.1em' }}>
          {topicLabel.toUpperCase()}
        </span>
        {q.consecutive > 0 && !q.mastered && (
          <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:9, color:'#FFB800', letterSpacing:'0.1em' }}>
            {q.consecutive}/3 IN A ROW
          </span>
        )}
        {q.mastered && (
          <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:9, color:'#00FF41', letterSpacing:'0.1em' }}>MASTERED</span>
        )}
      </div>

      {/* ── 3D FLIP CARD ── */}
      <div style={{ perspective:'1200px', marginBottom:20 }}>
        {/* key=q.id forces clean remount on card change, preventing backface bleed-through */}
        <div key={q.id} style={{
          position: flipAnimating ? 'relative' : 'static',
          minHeight: flipAnimating ? 360 : undefined,
          transformStyle: flipAnimating ? 'preserve-3d' : undefined,
          transform: flipAnimating ? (isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)') : undefined,
          transition: flipAnimating ? 'transform 0.58s cubic-bezier(0.4,0.2,0.2,1)' : 'none',
        }}>

          {/* ── FRONT FACE ── */}
          {(!isFlipped || flipAnimating) && (
            <div style={{
              position: flipAnimating ? 'absolute' : 'relative',
              inset: flipAnimating ? 0 : undefined,
              backfaceVisibility: flipAnimating ? 'hidden' : undefined,
              WebkitBackfaceVisibility: flipAnimating ? 'hidden' : undefined,
              background:'#0d1117', border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:12, padding:'clamp(18px,4vw,28px)',
            }}>
              {/* Type badge */}
              {q.type === 'select-all' && <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:9, color:'#FFB800', background:'rgba(255,184,0,0.07)', border:'1px solid rgba(255,184,0,0.18)', padding:'3px 8px', borderRadius:4, letterSpacing:'0.1em', display:'inline-block', marginBottom:12 }}>SELECT ALL THAT APPLY</span>}
              {q.type === 'fill-blank' && <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:9, color:'#00D4FF', background:'rgba(0,212,255,0.07)', border:'1px solid rgba(0,212,255,0.18)', padding:'3px 8px', borderRadius:4, letterSpacing:'0.1em', display:'inline-block', marginBottom:12 }}>FILL IN THE BLANK</span>}
              {q.type === 'qa' && <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:9, color:'#A855F7', background:'rgba(168,85,247,0.07)', border:'1px solid rgba(168,85,247,0.18)', padding:'3px 8px', borderRadius:4, letterSpacing:'0.1em', display:'inline-block', marginBottom:12 }}>CONCEPT CARD</span>}

              {/* Question / front text */}
              <p style={{ fontFamily:'Inter,sans-serif', fontWeight:600, fontSize:'clamp(15px,2.5vw,18px)', color:'#fff', lineHeight:1.75, margin:'0 0 16px' }}>
                <InlineText text={q.type === 'qa' ? q.front : q.question} />
              </p>

              {/* Code block */}
              {q.code && (
                <pre style={{ margin:'8px 0 14px', padding:'12px 16px', background:'#161b22', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, fontFamily:'JetBrains Mono,monospace', fontSize:12.5, lineHeight:1.65, color:'#d4d4d4', overflowX:'auto', whiteSpace:'pre-wrap' }}>
                  <code dangerouslySetInnerHTML={{ __html: highlightR(q.code) }} />
                </pre>
              )}

              {/* MULTIPLE CHOICE options */}
              {q.type === 'multiple' && q.options && (
                <div style={{ display:'flex', flexDirection:'column', gap:8, margin:'4px 0 16px' }}>
                  {q.options.map((opt, i) => {
                    const sel = selectedAnswer === i
                    return (
                      <button key={i} onClick={() => setSelectedAnswer(i)} style={{
                        display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px',
                        borderRadius:8, cursor:'pointer', textAlign:'left',
                        background: sel ? 'rgba(0,212,255,0.1)'  : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${sel ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.07)'}`,
                        transition:'all 0.15s',
                      }}>
                        <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, fontWeight:700, color: sel ? '#00D4FF' : 'rgba(255,255,255,0.25)', minWidth:18, flexShrink:0, marginTop:2 }}>
                          {sel ? '>' : String.fromCharCode(65+i)}
                        </span>
                        <span style={{ fontFamily:'Inter,sans-serif', fontSize:14, color: sel ? '#fff' : 'rgba(255,255,255,0.6)', lineHeight:1.55 }}>
                          <InlineText text={opt} />
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* SELECT-ALL options */}
              {q.type === 'select-all' && q.options && (
                <div style={{ display:'flex', flexDirection:'column', gap:8, margin:'4px 0 16px' }}>
                  {q.options.map((opt, i) => {
                    const checked = checkboxState.includes(i)
                    return (
                      <label key={i} style={{
                        display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px',
                        borderRadius:8, cursor:'pointer',
                        background: checked ? 'rgba(255,184,0,0.08)' : 'rgba(255,255,255,0.02)',
                        border:`1px solid ${checked ? 'rgba(255,184,0,0.35)' : 'rgba(255,255,255,0.07)'}`,
                        transition:'all 0.15s',
                      }}>
                        <div style={{ width:16, height:16, borderRadius:3, border:`2px solid ${checked ? '#FFB800' : 'rgba(255,255,255,0.2)'}`, background: checked ? '#FFB800' : 'transparent', flexShrink:0, marginTop:2, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {checked && <span style={{ color:'#000', fontSize:11, fontWeight:900, lineHeight:1 }}>+</span>}
                        </div>
                        <span style={{ fontFamily:'Inter,sans-serif', fontSize:14, color: checked ? '#fff' : 'rgba(255,255,255,0.6)', lineHeight:1.55 }}>
                          <InlineText text={opt} />
                        </span>
                        <input type="checkbox" checked={checked} onChange={e => {
                          setCheckboxState(prev => e.target.checked ? [...prev,i] : prev.filter(x=>x!==i))
                        }} style={{ display:'none' }} />
                      </label>
                    )
                  })}
                </div>
              )}

              {/* FILL-BLANK input */}
              {q.type === 'fill-blank' && (
                <div style={{ margin:'8px 0 16px' }}>
                  {q.template && <div style={{ marginBottom:10, padding:'8px 12px', background:'rgba(0,212,255,0.04)', border:'1px solid rgba(0,212,255,0.1)', borderRadius:6, fontFamily:'JetBrains Mono,monospace', fontSize:12, color:'rgba(255,255,255,0.45)', lineHeight:1.6 }}>{q.template}</div>}
                  <input
                    type="text"
                    value={fillInput}
                    onChange={e => setFillInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && canFlip) doFlip() }}
                    placeholder="Type your answer..."
                    style={{ width:'100%', padding:'12px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, fontFamily:'JetBrains Mono,monospace', fontSize:14, color:'#fff', outline:'none', boxSizing:'border-box' }}
                  />
                </div>
              )}

              {/* Flip button */}
              <div style={{ textAlign:'center', marginTop:8 }}>
                <button onClick={doFlip} disabled={!canFlip} style={{
                  background: canFlip ? 'rgba(0,255,65,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${canFlip ? 'rgba(0,255,65,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  color: canFlip ? '#00FF41' : 'rgba(255,255,255,0.2)',
                  borderRadius:6, padding:'12px 32px', fontFamily:'JetBrains Mono,monospace', fontWeight:700, fontSize:12, cursor: canFlip ? 'pointer' : 'not-allowed', letterSpacing:'0.1em', transition:'all 0.15s',
                }}>
                  {q.type === 'qa' ? 'REVEAL ANSWER' : 'FLIP TO CHECK'}
                </button>
              </div>
            </div>
          )}

          {/* ── BACK FACE ── */}
          {(isFlipped || flipAnimating) && (
            <div style={{
              position: flipAnimating ? 'absolute' : 'relative',
              inset: flipAnimating ? 0 : undefined,
              backfaceVisibility: flipAnimating ? 'hidden' : undefined,
              WebkitBackfaceVisibility: flipAnimating ? 'hidden' : undefined,
              transform: flipAnimating ? 'rotateY(180deg)' : undefined,
              background:'#0d1117',
              border: `1px solid ${effectiveCorrect === true ? 'rgba(0,255,65,0.3)' : effectiveCorrect === false ? 'rgba(255,45,85,0.3)' : 'rgba(168,85,247,0.3)'}`,
              borderRadius:12, padding:'clamp(18px,4vw,28px)',
            }}>
              {/* Result banner */}
              {effectiveCorrect !== null && (
                <div style={{ marginBottom:16, padding:'10px 16px', borderRadius:8,
                  background: effectiveCorrect ? 'rgba(0,255,65,0.08)' : 'rgba(255,45,85,0.08)',
                  border: `1px solid ${effectiveCorrect ? 'rgba(0,255,65,0.2)' : 'rgba(255,45,85,0.2)'}`,
                  display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:13, fontWeight:700,
                    color: effectiveCorrect ? '#00FF41' : '#FF2D55' }}>
                    {overruled ? 'OVERRULED - MARKED CORRECT' : effectiveCorrect ? 'CORRECT' : 'INCORRECT'}
                  </span>
                </div>
              )}

              {/* Q&A back: show definition */}
              {q.type === 'qa' && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:'0.15em', marginBottom:8 }}>ANSWER</div>
                  <p style={{ fontFamily:'Inter,sans-serif', fontSize:15, color:'rgba(255,255,255,0.85)', lineHeight:1.75, margin:0 }}>
                    <InlineText text={q.back} />
                  </p>
                  {q.explanation && (
                    <p style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:'rgba(255,255,255,0.5)', lineHeight:1.7, marginTop:12, paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                      <InlineText text={q.explanation} />
                    </p>
                  )}
                </div>
              )}

              {/* MULTIPLE CHOICE result */}
              {q.type === 'multiple' && q.options && (
                <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:16 }}>
                  {q.options.map((opt, i) => {
                    const isCorrectOpt = i === q.answer
                    const isSelectedOpt = i === selectedAnswer
                    const isWrongSel = isSelectedOpt && !isCorrectOpt
                    return (
                      <div key={i} style={{
                        display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px', borderRadius:8,
                        background: isCorrectOpt ? 'rgba(0,255,65,0.08)' : isWrongSel ? 'rgba(255,45,85,0.08)' : 'rgba(255,255,255,0.01)',
                        border: `1px solid ${isCorrectOpt ? 'rgba(0,255,65,0.35)' : isWrongSel ? 'rgba(255,45,85,0.35)' : 'rgba(255,255,255,0.04)'}`,
                      }}>
                        <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, fontWeight:700, minWidth:18, flexShrink:0, marginTop:2,
                          color: isCorrectOpt ? '#00FF41' : isWrongSel ? '#FF2D55' : 'rgba(255,255,255,0.15)' }}>
                          {isCorrectOpt ? '+' : isWrongSel ? 'x' : String.fromCharCode(65+i)}
                        </span>
                        <span style={{ fontFamily:'Inter,sans-serif', fontSize:14, lineHeight:1.55,
                          color: isCorrectOpt ? '#00FF41' : isWrongSel ? '#FF2D55' : 'rgba(255,255,255,0.3)' }}>
                          <InlineText text={opt} />
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* SELECT-ALL result */}
              {q.type === 'select-all' && q.options && (
                <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:16 }}>
                  {q.options.map((opt, i) => {
                    const isCorrectOpt = (q.answer ?? []).includes(i)
                    const wasSelected  = checkboxState.includes(i)
                    const isWrongSel   = wasSelected && !isCorrectOpt
                    const isMissed     = isCorrectOpt && !wasSelected
                    return (
                      <div key={i} style={{
                        display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px', borderRadius:8,
                        background: isCorrectOpt && wasSelected ? 'rgba(0,255,65,0.08)'
                          : isWrongSel ? 'rgba(255,45,85,0.08)'
                          : isMissed ? 'rgba(255,184,0,0.06)'
                          : 'rgba(255,255,255,0.01)',
                        border: `1px solid ${isCorrectOpt && wasSelected ? 'rgba(0,255,65,0.3)'
                          : isWrongSel ? 'rgba(255,45,85,0.3)'
                          : isMissed ? 'rgba(255,184,0,0.25)'
                          : 'rgba(255,255,255,0.04)'}`,
                      }}>
                        <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, fontWeight:700, minWidth:18, flexShrink:0, marginTop:2,
                          color: isCorrectOpt && wasSelected ? '#00FF41' : isWrongSel ? '#FF2D55' : isMissed ? '#FFB800' : 'rgba(255,255,255,0.15)' }}>
                          {isCorrectOpt && wasSelected ? '+' : isWrongSel ? 'x' : isMissed ? '!' : String.fromCharCode(65+i)}
                        </span>
                        <span style={{ fontFamily:'Inter,sans-serif', fontSize:14, lineHeight:1.55,
                          color: isCorrectOpt && wasSelected ? '#00FF41' : isWrongSel ? '#FF2D55' : isMissed ? '#FFB800' : 'rgba(255,255,255,0.3)' }}>
                          <InlineText text={opt} />
                          {isMissed && <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'#FFB800', marginLeft:8 }}>(missed)</span>}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* FILL-BLANK result */}
              {q.type === 'fill-blank' && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                    <div style={{ flex:1, padding:'10px 14px', borderRadius:8,
                      background: effectiveCorrect ? 'rgba(0,255,65,0.07)' : 'rgba(255,45,85,0.07)',
                      border: `1px solid ${effectiveCorrect ? 'rgba(0,255,65,0.25)' : 'rgba(255,45,85,0.25)'}` }}>
                      <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:9, color:'rgba(255,255,255,0.3)', marginBottom:4 }}>YOUR ANSWER</div>
                      <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:14, color: effectiveCorrect ? '#00FF41' : '#FF2D55' }}>{fillInput || '(blank)'}</span>
                    </div>
                    {!effectiveCorrect && (
                      <div style={{ flex:1, padding:'10px 14px', borderRadius:8, background:'rgba(0,255,65,0.07)', border:'1px solid rgba(0,255,65,0.25)' }}>
                        <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:9, color:'rgba(255,255,255,0.3)', marginBottom:4 }}>CORRECT ANSWER</div>
                        <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:14, color:'#00FF41' }}>{q.blanks?.[0] ?? String(q.answer)}</span>
                      </div>
                    )}
                  </div>
                  {!effectiveCorrect && !overruled && (
                    <button onClick={handleOverrule} style={{ background:'rgba(255,184,0,0.1)', border:'1px solid rgba(255,184,0,0.3)', color:'#FFB800', borderRadius:6, padding:'7px 16px', fontFamily:'JetBrains Mono,monospace', fontSize:11, cursor:'pointer', letterSpacing:'0.08em' }}>
                      MY ANSWER WAS CORRECT (OVERRIDE)
                    </button>
                  )}
                </div>
              )}

              {/* Explanation */}
              {q.explanation && (
                <div style={{ padding:'12px 14px', background:'rgba(255,255,255,0.02)', borderRadius:8, borderLeft:'3px solid rgba(255,255,255,0.12)', marginBottom:16 }}>
                  <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:'0.15em', marginBottom:6 }}>
                    {effectiveCorrect === false ? 'WHY YOU WERE WRONG / WHY THIS IS RIGHT' : 'EXPLANATION'}
                  </div>
                  <p style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:'rgba(255,255,255,0.65)', margin:0, lineHeight:1.75 }}>
                    <InlineText text={q.explanation} />
                  </p>
                </div>
              )}

              {/* AI Explain button */}
              {effectiveCorrect === false && (
                <div style={{ marginBottom:16 }}>
                  {!aiExplanation && !aiLoading && (
                    <button onClick={fetchAiExplain} style={{ background:'rgba(168,85,247,0.1)', border:'1px solid rgba(168,85,247,0.3)', color:'#A855F7', borderRadius:6, padding:'9px 18px', fontFamily:'JetBrains Mono,monospace', fontSize:11, cursor:'pointer', letterSpacing:'0.06em' }}>
                      EXPLAIN BETTER WITH AI
                    </button>
                  )}
                  {aiLoading && <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'rgba(168,85,247,0.6)' }}>Thinking...</span>}
                  {aiError && <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'#FF2D55' }}>{aiError}</span>}
                  {aiExplanation && (
                    <div style={{ padding:'14px 16px', background:'rgba(168,85,247,0.06)', border:'1px solid rgba(168,85,247,0.2)', borderRadius:8, borderLeft:'3px solid #A855F7' }}>
                      <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:9, color:'rgba(168,85,247,0.7)', letterSpacing:'0.15em', marginBottom:8 }}>AI EXPLANATION</div>
                      <p style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:'rgba(255,255,255,0.75)', margin:0, lineHeight:1.75 }}>{aiExplanation}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Action buttons */}
              {q.type === 'qa' ? (
                // Self-assessment for concept cards
                <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap', marginTop:8 }}>
                  <button onClick={() => recordResult(false)} style={{ background:'rgba(255,45,85,0.12)', border:'1px solid #FF2D55', color:'#FF2D55', borderRadius:6, padding:'10px 20px', fontFamily:'JetBrains Mono,monospace', fontSize:12, cursor:'pointer', fontWeight:700, letterSpacing:'0.05em' }}>DIDN'T KNOW</button>
                  <button onClick={() => recordResult(true)}  style={{ background:'rgba(0,255,65,0.12)',  border:'1px solid #00FF41', color:'#00FF41', borderRadius:6, padding:'10px 20px', fontFamily:'JetBrains Mono,monospace', fontSize:12, cursor:'pointer', fontWeight:700, letterSpacing:'0.05em' }}>KNEW IT</button>
                </div>
              ) : (
                <div style={{ display:'flex', justifyContent:'center', marginTop:8 }}>
                  <button onClick={() => recordResult(!!effectiveCorrect)} style={{ background: effectiveCorrect ? 'rgba(0,255,65,0.12)' : 'rgba(255,45,85,0.12)', border:`1px solid ${effectiveCorrect ? '#00FF41' : '#FF2D55'}`, color: effectiveCorrect ? '#00FF41' : '#FF2D55', borderRadius:6, padding:'12px 36px', fontFamily:'JetBrains Mono,monospace', fontSize:13, cursor:'pointer', fontWeight:700, letterSpacing:'0.08em' }}>
                    NEXT CARD
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
