import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import ImportTaskModal from '../components/ImportTaskModal';
import AddTaskModal from '../components/AddTaskModal';
import ExportReportModal from '../components/ExportReportModal';
import SystemSettingsModal from '../components/SystemSettingsModal';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface Student {
  id: number;
  username: string;
  nickname: string;
  tasks_completed?: number;
  total_time_minutes?: number;
}

interface Alert {
  id: number;
  student_id: number;
  student_name: string;
  task_id: number;
  task_title: string;
  message: string;
  alert_type: string;
  stay_minutes?: number;
  attempt_count?: number;
  is_read: boolean;
  created_at: string;
}

interface ClassData {
  id: number;
  name: string;
  student_count: number;
}

interface StatsData {
  total_students: number;
  tasks_completed: number;
  total_time_minutes: number;
  avg_pass_rate: number;
}

export default function TeacherDashboard() {
  const queryClient = useQueryClient();
  const [teacherId, setTeacherId] = useState<number>(1); // 演示用
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // 获取班级数据
  const { data: classData } = useQuery<ClassData>({
    queryKey: ['class', teacherId],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/stats/class/1`);
      return res.data.class;
    },
    enabled: !!teacherId,
  });

  // 获取预警列表
  const { data: alertsData, refetch: refetchAlerts } = useQuery<{ alerts: Alert[] }>({
    queryKey: ['alerts', teacherId],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/stats/alerts/${teacherId}`);
      return { alerts: res.data.alerts || [] };
    },
    enabled: !!teacherId,
  });

  // 获取学生列表
  const { data: studentsData, refetch: refetchStudents } = useQuery<{ students: Student[] }>({
    queryKey: ['class-students', classData?.id],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/stats/class/${classData?.id}`);
      return { students: res.data.students || [] };
    },
    enabled: !!classData?.id,
  });

  // 获取班级统计
  const { data: statsData } = useQuery<StatsData>({
    queryKey: ['class-stats', classData?.id],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/stats/class/${classData?.id}`);
      const students = res.data.students || [];
      return {
        total_students: students.length,
        tasks_completed: students.reduce((sum: number, s: any) => sum + (s.tasks_completed || 0), 0),
        total_time_minutes: students.reduce((sum: number, s: any) => sum + (s.total_time_minutes || 0), 0),
        avg_pass_rate: res.data.summary?.avg_completion || 0,
      };
    },
    enabled: !!studentsData,
  });

  // 标记预警已读
  const markReadMutation = useMutation({
    mutationFn: async (alertId: number) => {
      await axios.post(`${API_BASE}/stats/alerts/read`, { alert_id: alertId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const alerts = alertsData?.alerts || [];
  const students = studentsData?.students || [];
  const unreadAlerts = alerts.filter(a => !a.is_read);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold cyber-text-green">🎛️ 老师后台</h1>
          <p className="text-gray-400 mt-1">{classData?.name || '加载中...'}</p>
        </div>
        <button 
          onClick={() => {
            refetchAlerts();
            refetchStudents();
          }}
          className="cyber-button text-sm"
        >
          🔄 刷新数据
        </button>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="cyber-card p-4 text-center">
          <div className="text-3xl font-bold text-neon-cyan">{statsData?.total_students || 0}</div>
          <div className="text-sm text-gray-400">学生数</div>
        </div>
        <div className="cyber-card p-4 text-center">
          <div className="text-3xl font-bold text-neon-green">{statsData?.tasks_completed || 0}</div>
          <div className="text-sm text-gray-400">完成题目</div>
        </div>
        <div className="cyber-card p-4 text-center">
          <div className="text-3xl font-bold text-neon-purple">{statsData?.total_time_minutes || 0}</div>
          <div className="text-sm text-gray-400">总用时(分钟)</div>
        </div>
        <div className="cyber-card p-4 text-center">
          <div className="text-3xl font-bold text-neon-pink">{statsData?.avg_pass_rate || 0}%</div>
          <div className="text-sm text-gray-400">平均通过率</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 预警列表 */}
        <div className="cyber-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-neon-pink">🚨 需要关注</h2>
            {unreadAlerts.length > 0 && (
              <span className="px-2 py-1 text-xs rounded-full bg-neon-pink/20 text-neon-pink">
                {unreadAlerts.length} 条未读
              </span>
            )}
          </div>
          
          {alerts.length > 0 ? (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-4 rounded-lg transition-all ${
                    alert.is_read 
                      ? 'bg-cyber-dark/50 opacity-60' 
                      : 'bg-cyber-dark border border-neon-pink/30 hover:border-neon-pink/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-medium text-neon-cyan">{alert.student_name}</span>
                      <span className="text-gray-500 text-sm ml-2">@{alert.task_title}</span>
                    </div>
                    {!alert.is_read && (
                      <button
                        onClick={() => markReadMutation.mutate(alert.id)}
                        className="text-xs text-gray-400 hover:text-neon-cyan"
                      >
                        ✓ 已读
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{alert.message}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {alert.stay_minutes && <span>⏱️ {alert.stay_minutes}分钟</span>}
                    {alert.attempt_count && <span>🔄 {alert.attempt_count}次尝试</span>}
                    <span>📅 {new Date(alert.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🎉</div>
              <p className="text-gray-400">暂无预警，学生学习状态良好！</p>
            </div>
          )}
        </div>

        {/* 学生列表 */}
        <div className="cyber-card p-6">
          <h2 className="text-xl font-bold text-neon-cyan mb-4">📊 学生概览</h2>
          
          {students.length > 0 ? (
            <div className="space-y-4">
              {students.map((student) => (
                <div 
                  key={student.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-cyber-dark hover:bg-cyber-dark/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan to-neon-green flex items-center justify-center text-lg">
                      {student.nickname?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="font-medium text-neon-green">{student.nickname}</div>
                      <div className="text-xs text-gray-500">
                        完成 {student.tasks_completed || 0} 题 | 用时 {student.total_time_minutes || 0}分钟
                      </div>
                    </div>
                  </div>
                  <button className="text-neon-cyan hover:underline text-sm">
                    查看详情 →
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-gray-400">暂无学生数据</p>
            </div>
          )}
        </div>

        {/* 快捷操作 */}
        <div className="cyber-card p-6 lg:col-span-2">
          <h2 className="text-xl font-bold text-neon-purple mb-4">⚡ 快捷操作</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button onClick={() => setShowAddModal(true)} className="p-4 rounded-lg bg-cyber-dark hover:bg-cyber-dark/80 text-center transition-colors cursor-pointer">
              <div className="text-2xl mb-2">📝</div>
              <div className="text-sm text-gray-300">添加题目</div>
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="p-4 rounded-lg bg-cyber-dark hover:bg-cyber-dark/80 text-center transition-colors cursor-pointer"
            >
              <div className="text-2xl mb-2">📤</div>
              <div className="text-sm text-gray-300">批量导入</div>
            </button>
            <button onClick={() => setShowExportModal(true)} className="p-4 rounded-lg bg-cyber-dark hover:bg-cyber-dark/80 text-center transition-colors cursor-pointer">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm text-gray-300">导出报告</div>
            </button>
            <button onClick={() => setShowSettingsModal(true)} className="p-4 rounded-lg bg-cyber-dark hover:bg-cyber-dark/80 text-center transition-colors cursor-pointer">
              <div className="text-2xl mb-2">⚙️</div>
              <div className="text-sm text-gray-300">系统设置</div>
            </button>
          </div>
        </div>
      </div>

      {/* 导入Modal */}
      <ImportTaskModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }}
      />

      {/* 添加题目Modal */}
      <AddTaskModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={(taskId) => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }}
      />

      {/* 导出报告Modal */}
      <ExportReportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

      {/* 系统设置Modal */}
      <SystemSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      {/* Footer */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>💡 提示：点击"已读"可将预警标记处理</p>
      </div>
    </div>
  );
}
