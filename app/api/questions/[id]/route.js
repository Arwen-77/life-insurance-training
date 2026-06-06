import { NextResponse } from 'next/server';
import { db } from '../../../../database';

// 获取单个题目
export async function GET(request, { params }) {
  const { id } = params;

  return new Promise((resolve) => {
    db.get('SELECT * FROM questions WHERE id = ?', [id], (err, row) => {
      if (err) {
        resolve(NextResponse.json({ error: err.message }, { status: 500 }));
      } else if (!row) {
        resolve(NextResponse.json({ error: '题目不存在' }, { status: 404 }));
      } else {
        row.options = JSON.parse(row.options);
        resolve(NextResponse.json(row));
      }
    });
  });
}

// 更新题目
export async function PUT(request, { params }) {
  const { id } = params;
  
  try {
    const body = await request.json();
    const { question, options, answer, explanation, category, difficulty } = body;

    return new Promise((resolve) => {
      const updates = [];
      const params = [];

      if (question) {
        updates.push('question = ?');
        params.push(question);
      }
      if (options) {
        updates.push('options = ?');
        params.push(JSON.stringify(options));
      }
      if (answer !== undefined) {
        updates.push('answer = ?');
        params.push(answer);
      }
      if (explanation !== undefined) {
        updates.push('explanation = ?');
        params.push(explanation);
      }
      if (category) {
        updates.push('category = ?');
        params.push(category);
      }
      if (difficulty !== undefined) {
        updates.push('difficulty = ?');
        params.push(difficulty);
      }

      if (updates.length === 0) {
        resolve(NextResponse.json({ error: '没有提供更新字段' }, { status: 400 }));
        return;
      }

      params.push(id);

      db.run(
        'UPDATE questions SET ' + updates.join(', ') + ' WHERE id = ?',
        params,
        function(err) {
          if (err) {
            resolve(NextResponse.json({ error: err.message }, { status: 500 }));
          } else if (this.changes === 0) {
            resolve(NextResponse.json({ error: '题目不存在' }, { status: 404 }));
          } else {
            resolve(NextResponse.json({ message: '更新成功' }));
          }
        }
      );
    });
  } catch (error) {
    return NextResponse.json({ error: '请求体解析失败' }, { status: 400 });
  }
}

// 删除题目
export async function DELETE(request, { params }) {
  const { id } = params;

  return new Promise((resolve) => {
    db.run('DELETE FROM questions WHERE id = ?', [id], function(err) {
      if (err) {
        resolve(NextResponse.json({ error: err.message }, { status: 500 }));
      } else if (this.changes === 0) {
        resolve(NextResponse.json({ error: '题目不存在' }, { status: 404 }));
      } else {
        resolve(NextResponse.json({ message: '删除成功' }));
      }
    });
  });
}
