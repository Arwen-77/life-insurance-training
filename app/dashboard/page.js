'use client';

import { Button, Card, Space, Typography } from 'antd';
import { UserOutlined, LogoutOutlined, HomeOutlined, SettingOutlined, BookOutlined, BarChartOutlined, TrophyOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const { Title, Paragraph } = Typography;

export default function Dashboard() {
  const [username, setUsername] = useState('');
  const router = useRouter();

  useEffect(() => {
    // 检查是否有 token
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    // 从 token 中解码用户名（简单演示）
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      setUsername(decoded.username);
    } catch {
      setUsername('用户');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* 头部 */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <HomeOutlined className="text-3xl text-blue-600" />
            <Title level={2}>仪表盘</Title>
          </div>
          <Button 
            type="default" 
            icon={<LogoutOutlined />} 
            onClick={handleLogout}
          >
            退出登录
          </Button>
        </div>

        {/* 欢迎卡片 */}
        <Card className="mb-8 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <UserOutlined className="text-3xl text-blue-600" />
            </div>
            <div>
              <Title level={3}>欢迎回来，{username}！</Title>
              <Paragraph>您已成功登录系统</Paragraph>
            </div>
          </div>
        </Card>

        {/* 功能卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card 
            hoverable 
            className="cursor-pointer transition-all hover:shadow-lg"
            bodyStyle={{ textAlign: 'center' }}
            onClick={() => router.push('/quiz')}
          >
            <BookOutlined className="text-4xl text-blue-600 mx-auto mb-4" />
            <Title level={4}>开始刷题</Title>
            <Paragraph>挑战你的知识储备</Paragraph>
          </Card>
          <Card 
            hoverable 
            className="cursor-pointer transition-all hover:shadow-lg"
            bodyStyle={{ textAlign: 'center' }}
            onClick={() => router.push('/training')}
          >
            <TrophyOutlined className="text-4xl text-purple-600 mx-auto mb-4" />
            <Title level={4}>模拟训练</Title>
            <Paragraph>寿险销售场景实战</Paragraph>
          </Card>
          <Card 
            hoverable 
            className="cursor-pointer transition-all hover:shadow-lg"
            bodyStyle={{ textAlign: 'center' }}
            onClick={() => router.push('/records')}
          >
            <BarChartOutlined className="text-4xl text-green-600 mx-auto mb-4" />
            <Title level={4}>答题记录</Title>
            <Paragraph>查看答题历史和统计</Paragraph>
          </Card>
          <Card 
            hoverable 
            className="cursor-pointer transition-all hover:shadow-lg"
            bodyStyle={{ textAlign: 'center' }}
          >
            <SettingOutlined className="text-4xl text-orange-600 mx-auto mb-4" />
            <Title level={4}>个人设置</Title>
            <Paragraph>管理您的个人信息</Paragraph>
          </Card>
          <Card 
            hoverable 
            className="cursor-pointer transition-all hover:shadow-lg"
            bodyStyle={{ textAlign: 'center' }}
          >
            <UserOutlined className="text-4xl text-cyan-600 mx-auto mb-4" />
            <Title level={4}>用户管理</Title>
            <Paragraph>查看和管理用户</Paragraph>
          </Card>
        </div>
      </div>
    </div>
  );
}
