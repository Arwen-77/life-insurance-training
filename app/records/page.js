'use client';

import { useState, useEffect } from 'react';
import { Card, Table, Tag, Progress, Typography, Statistic, Row, Col, Empty, Button } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, BarChartOutlined, BookOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Paragraph } = Typography;

export default function RecordsPage() {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({ total_answers: 0, correct_answers: 0, accuracy: 0 });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 检查是否有 token
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    // 从 token 中解码用户ID
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      fetchRecords(decoded.id);
    } catch {
      router.push('/');
    }
  }, []);

  const fetchRecords = async (userId) => {
    try {
      const response = await fetch(`/api/records?userId=${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        setRecords(data.records || []);
        setStats(data.stats || { total_answers: 0, correct_answers: 0, accuracy: 0 });
      }
    } catch (error) {
      console.error('获取答题记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '题目',
      dataIndex: 'question',
      key: 'question',
      width: '40%',
      render: (text) => (
        <div className="truncate" style={{ maxWidth: '300px' }}>
          {text}
        </div>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category) => <Tag color="blue">{category}</Tag>
    },
    {
      title: '你的答案',
      dataIndex: 'user_answer',
      key: 'user_answer',
      render: (answer, record) => {
        const option = String.fromCharCode(65 + answer);
        return (
          <span className={record.is_correct ? 'text-green-600' : 'text-red-600'}>
            {option}. {record.options[answer]}
          </span>
        );
      }
    },
    {
      title: '结果',
      dataIndex: 'is_correct',
      key: 'is_correct',
      render: (isCorrect) => (
        isCorrect ? 
          <Tag icon={<CheckCircleOutlined />} color="success">正确</Tag> :
          <Tag icon={<CloseCircleOutlined />} color="error">错误</Tag>
      )
    },
    {
      title: '答题时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => new Date(time).toLocaleString('zh-CN')
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BarChartOutlined className="text-6xl text-blue-600 mb-4" />
          <Title level={2}>加载中...</Title>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* 头部 */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <BarChartOutlined className="text-3xl text-blue-600" />
            <Title level={2}>答题记录</Title>
          </div>
          <Button
            icon={<BookOutlined />}
            onClick={() => router.push('/dashboard')}
          >
            返回仪表盘
          </Button>
        </div>

        {/* 统计卡片 */}
        <Row gutter={16} className="mb-8">
          <Col span={8}>
            <Card>
              <Statistic
                title="总答题数"
                value={stats.total_answers}
                prefix={<BarChartOutlined />}
                valueStyle={{ color: '#3b82f6' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="正确数"
                value={stats.correct_answers}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#10b981' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="正确率"
                value={stats.accuracy}
                suffix="%"
                valueStyle={{ color: stats.accuracy >= 60 ? '#10b981' : '#ef4444' }}
              />
              <Progress 
                percent={stats.accuracy} 
                strokeColor={stats.accuracy >= 60 ? '#10b981' : '#ef4444'}
                showInfo={false}
              />
            </Card>
          </Col>
        </Row>

        {/* 答题记录表格 */}
        <Card title="答题历史" className="shadow-lg">
          {records.length === 0 ? (
            <Empty
              description="暂无答题记录"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="primary" onClick={() => router.push('/quiz')}>
                开始答题
              </Button>
            </Empty>
          ) : (
            <Table
              dataSource={records}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
