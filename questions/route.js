import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const difficulty = searchParams.get('difficulty');

  let query = 'SELECT * FROM questions';
  let params = [];
  let conditions = [];

  if (category) {
    conditions.push(`category = $${params.length + 1}`);
    params.push(category);
  }

  if (difficulty) {
    conditions.push(`difficulty = $${params.length + 1}`);
    params.push(difficulty);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';

  const result = await pool.query(query, params);
  const questions = result.rows.map(q => ({
    ...q,
    options: JSON.parse(q.options)
  }));

  return NextResponse.json(questions);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { question, options, answer, explanation, category, difficulty } = body;

    if (!question || !options || answer === undefined) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
    }

    const result = await pool.query(
      'INSERT INTO questions (question, options, answer, explanation, category, difficulty) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [question, JSON.stringify(options), answer, explanation, category || '综合', difficulty || 1]
    );

    const newQuestion = result.rows[0];
    return NextResponse.json({
      ...newQuestion,
      options: JSON.parse(newQuestion.options)
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
