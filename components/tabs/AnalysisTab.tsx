'use client';

import { useState, useEffect } from 'react';
import { BarChart3, RefreshCw, Search, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { analysisService } from '@/services/analysisService';
import { AnalyseRequest } from '@/types/analysis';

export default function AnalysisTab() {
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<AnalyseRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AnalyseRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'request' | 'running' | 'error' | 'done'>('all');

  // Load analysis requests on component mount
  useEffect(() => {
    loadRequests();
    
    // Set up real-time listener
    const unsubscribe = analysisService.subscribeToAnalyseRequests((requests) => {
      setRequests(requests);
      applyFilters(requests, filterStatus);
    });

    return () => unsubscribe();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    applyFilters(requests, filterStatus);
  }, [filterStatus, requests]);

  const loadRequests = async () => {
    try {
      const data = await analysisService.getAnalyseRequests();
      setRequests(data);
      applyFilters(data, filterStatus);
    } catch (error) {
      console.error('Error loading analysis requests:', error);
    }
  };

  const applyFilters = (requests: AnalyseRequest[], status: typeof filterStatus) => {
    if (status === 'all') {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(requests.filter(req => req.status === status));
    }
  };

  const handleAnalyze = async () => {
    if (!symbol.trim()) {
      alert('Vui lòng nhập mã chứng khoán');
      return;
    }

    try {
      setLoading(true);
      await analysisService.createAnalyseRequest(symbol.trim());
      setSymbol('');
      alert('Yêu cầu phân tích đã được gửi thành công!');
    } catch (error) {
      console.error('Error creating analysis request:', error);
      alert('Có lỗi xảy ra khi gửi yêu cầu phân tích');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'request':
        return 'bg-blue-100 text-blue-800';
      case 'running':
        return 'bg-yellow-100 text-yellow-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'request':
        return <Clock className="h-4 w-4" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'done':
        return <CheckCircle className="h-4 w-4" />;
      case 'error':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Phân Tích AI</h2>
          <p className="text-sm text-gray-600">Gửi yêu cầu phân tích và xem kết quả từ AI</p>
        </div>
        <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
          Tổng cộng <span className="font-bold">{requests.length}</span> yêu cầu
        </div>
      </div>

      {/* Analysis Request Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mã Chứng Khoán Cần Phân Tích
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="VD: VN30, VIC, VHM..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Nhập mã chứng khoán để AI phân tích xu hướng và đưa ra tín hiệu giao dịch
            </p>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading || !symbol.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {loading ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <BarChart3 className="h-5 w-5" />
                Phân Tích Ngay
              </>
            )}
          </button>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600 font-medium">Đang Chờ</p>
                <p className="text-xl font-bold text-gray-900">
                  {requests.filter(req => req.status === 'request').length}
                </p>
              </div>
              <Clock className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-yellow-600 font-medium">Đang Chạy</p>
                <p className="text-xl font-bold text-gray-900">
                  {requests.filter(req => req.status === 'running').length}
                </p>
              </div>
              <RefreshCw className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600 font-medium">Hoàn Thành</p>
                <p className="text-xl font-bold text-gray-900">
                  {requests.filter(req => req.status === 'done').length}
                </p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-600 font-medium">Lỗi</p>
                <p className="text-xl font-bold text-gray-900">
                  {requests.filter(req => req.status === 'error').length}
                </p>
              </div>
              <XCircle className="h-6 w-6 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Tất Cả ({requests.length})
        </button>
        <button
          onClick={() => setFilterStatus('request')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'request' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Đang Chờ ({requests.filter(req => req.status === 'request').length})
        </button>
        <button
          onClick={() => setFilterStatus('running')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'running' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Đang Chạy ({requests.filter(req => req.status === 'running').length})
        </button>
        <button
          onClick={() => setFilterStatus('done')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'done' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Hoàn Thành ({requests.filter(req => req.status === 'done').length})
        </button>
        <button
          onClick={() => setFilterStatus('error')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'error' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Lỗi ({requests.filter(req => req.status === 'error').length})
        </button>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Danh Sách Yêu Cầu Phân Tích</h3>
          <p className="text-sm text-gray-600">Các yêu cầu phân tích đã được gửi đến hệ thống AI</p>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có yêu cầu phân tích</h3>
            <p className="text-gray-600">
              {requests.length === 0
                ? 'Chưa có yêu cầu phân tích nào. Hãy nhập mã chứng khoán và gửi yêu cầu phân tích đầu tiên.'
                : 'Không có yêu cầu nào phù hợp với bộ lọc hiện tại.'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Cards View */}
            <div className="md:hidden">
              <div className="divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <div key={request.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-gray-900">{request.symbol}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {getStatusIcon(request.status)}
                            {request.status === 'request' ? 'Đang chờ' :
                             request.status === 'running' ? 'Đang chạy' :
                             request.status === 'done' ? 'Hoàn thành' : 'Lỗi'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">ID: {request.id?.substring(0, 8)}...</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Thời gian tạo:</span>
                        <span className="text-xs font-medium">{formatDate(request.created_at)}</span>
                      </div>
                      {request.updated_at && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Cập nhật lần cuối:</span>
                          <span className="text-xs font-medium">{formatDate(request.updated_at)}</span>
                        </div>
                      )}
                    </div>

                    {request.result && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">Kết quả phân tích:</div>
                        <div className="text-sm text-gray-700">{request.result}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mã CK
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng Thái
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thời Gian Tạo
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cập Nhật
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kết Quả
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900">
                            {request.id?.substring(0, 8)}...
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">
                            {request.symbol}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {getStatusIcon(request.status)}
                            {request.status === 'request' ? 'Đang chờ' :
                             request.status === 'running' ? 'Đang chạy' :
                             request.status === 'done' ? 'Hoàn thành' : 'Lỗi'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(request.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {request.updated_at ? formatDate(request.updated_at) : 'Chưa cập nhật'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700 max-w-xs">
                            {request.result || 'Đang chờ kết quả...'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Summary */}
        {filteredRequests.length > 0 && (
          <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
              <div className="text-sm text-gray-600">
                Hiển thị <span className="font-medium">{filteredRequests.length}</span> yêu cầu
              </div>
              <div className="text-sm text-gray-600">
                Tỷ lệ hoàn thành: <span className="font-medium">
                  {(() => {
                    const completed = requests.filter(req => req.status === 'done').length;
                    return requests.length > 0 ? `${((completed / requests.length) * 100).toFixed(1)}%` : '0%';
                  })()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
