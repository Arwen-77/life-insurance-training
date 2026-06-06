import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database', 'app.db');
const db = new sqlite3.Database(dbPath);

// 获取所有题目
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const difficulty = searchParams.get('difficulty');

  let sql = 'SELECT * FROM questions';
  let params = [];
  let conditions = [];

  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }
  if (difficulty) {
    conditions.push('difficulty = ?');
    params.push(difficulty);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY created_at DESC';

  return new Promise((resolve) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        resolve(NextResponse.json({ error: err.message }, { status: 500 }));
      } else {
        const questions = rows.map(q => ({
          ...q,
          options: JSON.parse(q.options)
        }));
        resolve(NextResponse.json(questions));
      }
    });
  });
}

// 创建题目
export async function POST(request) {
  try {
    const body = await request.json();
    const { question, options, answer, explanation, category, difficulty } = body;

    if (!question || !options || answer === undefined) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
    }

    return new Promise((resolve) => {
      db.run(
        'INSERT INTO questions (question, options, answer, explanation, category, difficulty) VALUES (?, ?, ?, ?, ?, ?)',
        [question, JSON.stringify(options), answer, explanation || '', category || '综合', difficulty || 1],
        function(err) {
          if (err) {
            resolve(NextResponse.json({ error: err.message }, { status: 500 }));
          } else {
            resolve(NextResponse.json({ 
              id: this.lastID, 
              question, 
              options, 
              answer, 
              explanation, 
              category, 
              difficulty 
            }, { status: 201 }));
          }
        }
      );
    });
  } catch (error) {
    return NextResponse.json({ error: '请求体解析失败' }, { status: 400 });
  }
}
