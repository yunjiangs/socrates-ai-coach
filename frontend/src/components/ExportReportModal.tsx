import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportReportModal({ isOpen, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<'students' | 'tasks' | 'full'>('full');
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [classId, setClassId] = useState(1);

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/stats/export`, {
        params: { type: reportType, format, class_id: classId },
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: format === 'csv' ? 'text/csv' : 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `socrates_report_${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      alert('导出失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="cyber-card max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-cyber-border">
          <h3 className="text-xl font-bold text-neon-cyan">📊 导出报告</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="p-6 space-y-5">
          {/* 报告类型 */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">报告类型</label>
            <div className="space-y-2">
              {[
                { v: 'full', l: '📋 完整报告（学生+题目+统计）' },
                { v: 'students', l: '👥 学生学习报告' },
                { v: 'tasks', l: '📝 题目完成情况' },
              ].map(r => (
                <button
                  key={r.v}
                  onClick={() => setReportType(r.v as any)}
                  className={`w-full p-3 rounded border text-sm text-left transition-all ${
                    reportType === r.v
                      ? 'border-neon-cyan bg-neon-cyan/10 text-white'
                      : 'border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {r.l}
                </button>
              ))}
            </div>
          </div>

          {/* 格式 */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">导出格式</label>
            <div className="flex gap-2">
              {[
                { v: 'csv', l: 'CSV表格' },
                { v: 'json', l: 'JSON数据' },
              ].map(f => (
                <button
                  key={f.v}
                  onClick={() => setFormat(f.v as any)}
                  className={`flex-1 py-2 rounded border text-sm ${
                    format === f.v
                      ? 'border-neon-green bg-neon-green/10 text-neon-green'
                      : 'border-gray-700 text-gray-400'
                  }`}
                >
                  {f.l}
                </button>
              ))}
            </div>
          </div>

          {/* 班级 */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">班级</label>
            <select
              value={classId}
              onChange={e => setClassId(Number(e.target.value))}
              className="cyber-input w-full"
            >
              <option value={1}>信奥入门班</option>
              <option value={2}>信奥进阶班</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="cyber-button flex-1">取消</button>
            <button onClick={handleExport} disabled={loading} className="cyber-button-primary flex-1">
              {loading ? '导出中...' : '📥 导出'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
