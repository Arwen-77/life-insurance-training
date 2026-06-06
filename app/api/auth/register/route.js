import { NextResponse } from 'next/server';
import { createUser, findUserByUsername } from '../../../../lib/auth';

/**
 * POST /api/auth/register
 * 用户注册
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password, email } = body;

    // 验证必填字段
    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    // 检查用户名是否已存在
    const existingUser = await findUserByUsername(username);
    if (existingUser) {
      return NextResponse.json(
        { error: '用户名已存在' },
        { status: 400 }
      );
    }

    // 创建用户
    const user = await createUser(username, password, email);

    return NextResponse.json({
      message: '注册成功',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    }, { status: 201 });
  } catch (error) {
    console.error('注册错误:', error);
    return NextResponse.json(
      { error: '注册失败' },
      { status: 500 }
    );
  }
}
