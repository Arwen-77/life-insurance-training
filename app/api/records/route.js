import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database', 'app.db');
const db = new sqlite3.Database(dbPath);

// 获取用户答题记录和统计
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });
  }

  return new Promise((resolve) => {
    // 获取答题统计
    db.get(
      `SELECT 
        COUNT(*) as total_answers,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_answers,
        ROUND(SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as accuracy
       FROM answer_records 
       WHERE user_id = ?`,
      [userId],
      (err, stats) => {
        if (err) {
          resolve(NextResponse.json({ error: err.message }, { status: 500 }));
          return;
        }

        // 获取最近答题记录
        db.all(
          `SELECT 
            ar.id,
            ar.question_id,
            ar.user_answer,
            ar.is_correct,
            ar.created_at,
            q.question,
            q.options,
            q.answer as correct_answer,
            q.category
           FROM answer_records ar
           JOIN questions q ON ar.question_id = q.id
           WHERE ar.user_id = ?
           ORDER BY ar.created_at DESC
           LIMIT 50`,
          [userId],
          (err, records) => {
            if (err) {
              resolve(NextResponse.json({ error: err.message }, { status: 500 }));
            } else {
              const formattedRecords = records.map(r => ({
                ...r,
                options: JSON.parse(r.options)
              }));
              
              resolve(NextResponse.json({
                stats: stats || { total_answers: 0, correct_answers: 0, accuracy: 0 },
                records: formattedRecords
              }));
            }
          }
        );
      }
    );
  });
}

// 保存答题记录
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, questionId, userAnswer, isCorrect } = body;

    if (!userId || !questionId || userAnswer === undefined || isCorrect === undefined) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
    }

    return new Promise((resolve) => {
      db.run(
        'INSERT INTO answer_records (user_id, question_id, user_answer, is_correct) VALUES (?, ?, ?, ?)',
        [userId, questionId, userAnswer, isCorrect ? 1 : 0],
        function(err) {
          if (err) {
            resolve(NextResponse.json({ error: err.message }, { status: 500 }));
          } else {
            resolve(NextResponse.json({ 
              id: this.lastID,
              message: '答题记录保存成功'
            }, { status: 201 }));
          }
        }
      );
    });
  } catch (error) {
    return NextResponse.json({ error: '请求体解析失败' }, { status: 400 });
  }
}
