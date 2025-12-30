// 导入服务器端操作函数
import { consumeCreditsAction } from '@/actions/billing/consume-credits'; // 消费积分操作
import { getCreditBalanceAction } from '@/actions/billing/get-credit-balance'; // 获取积分余额操作
import { getCreditStatsAction } from '@/actions/billing/get-credit-stats'; // 获取积分统计操作
import { getCreditTransactionsAction } from '@/actions/billing/get-credit-transactions'; // 获取积分交易记录操作

// 导入React Query相关函数
import {
  keepPreviousData, // 保持先前数据的配置项，用于分页时保持UI流畅
  useMutation, // 用于执行数据修改操作（POST/PUT/DELETE）的hook
  useQuery, // 用于执行数据查询操作（GET）的hook
  useQueryClient, // 用于访问QueryClient实例，进行缓存管理
} from '@tanstack/react-query';

// 导入排序状态类型
import type { SortingState } from '@tanstack/react-table'; // 表格排序状态类型

/**
 * 积分系统查询键常量
 * 使用层级结构组织缓存键，便于精确失效和更新
 */
export const creditsKeys = {
  // 根键：所有积分相关查询
  all: ['credits'] as const,

  // 积分余额查询键
  balance: () => [...creditsKeys.all, 'balance'] as const,

  // 积分统计查询键
  stats: () => [...creditsKeys.all, 'stats'] as const,

  // 交易记录查询键
  transactions: () => [...creditsKeys.all, 'transactions'] as const,

  /**
   * 带过滤条件的交易记录查询键
   * 包含分页、搜索和排序参数，确保不同参数组合有独立的缓存
   * @param filters - 过滤参数对象
   * @param filters.pageIndex - 页码（从0开始）
   * @param filters.pageSize - 每页条数
   * @param filters.search - 搜索关键字
   * @param filters.sorting - 排序规则数组
   */
  transactionsList: (filters: {
    pageIndex: number;
    pageSize: number;
    search: string;
    sorting: SortingState;
  }) => [...creditsKeys.transactions(), filters] as const,
};

/**
 * 获取积分余额的React Query hook
 * 提供积分余额的查询功能，包含加载状态、错误处理和自动缓存
 * @returns {QueryResult} 包含data, isLoading, error等属性的查询结果对象
 */
export function useCreditBalance() {
  return useQuery({
    // 查询键：使用balance()函数生成唯一的缓存键
    queryKey: creditsKeys.balance(),

    // 查询函数：实际执行数据获取的逻辑
    queryFn: async () => {
      console.log('Fetching credit balance...'); // 开发调试日志
      // 调用服务器端操作获取积分余额
      const result = await getCreditBalanceAction();

      // 检查服务器响应是否成功
      if (!result?.data?.success) {
        console.error('useCreditBalance error:', result?.data?.error); // 错误日志
        throw new Error(
          result?.data?.error || 'Failed to fetch credit balance' // 抛出错误供UI处理
        );
      }

      console.log('Credit balance fetched:', result.data.credits); // 成功日志

      // 返回积分余额，如果没有则返回0
      return result.data.credits || 0;
    },

    // 配置项：
    staleTime: 1000 * 30, // 数据30秒内视为新鲜，不触发后台刷新 (除非手动invalidate)
    retry: 2, // 失败重试2次
  });
}

/**
 * 获取积分统计信息的React Query hook
 * 用于获取积分使用统计、趋势等汇总数据
 * @returns {QueryResult} 统计数据的查询结果
 */
export function useCreditStats() {
  return useQuery({
    // 查询键：使用stats()函数生成
    queryKey: creditsKeys.stats(),

    queryFn: async () => {
      console.log('Fetching credit stats...'); // 调试日志

      // 调用服务器端操作获取统计信息
      const result = await getCreditStatsAction();

      // 错误处理
      if (!result?.data?.success) {
        console.error('useCreditStats error:', result?.data?.error);
        throw new Error(result?.data?.error || 'Failed to fetch credit stats');
      }

      console.log('Credit stats fetched:', result.data.data); // 成功日志

      // 返回统计数据
      return result.data.data;
    },

    // 配置项：
    staleTime: 1000 * 60, // 统计数据变化频率较低，设置1分钟缓存
  });
}

/**
 * 消费积分的React Query mutation hook
 * 用于执行积分消费操作，并自动更新相关缓存
 * @returns {MutationResult} 包含mutate, mutateAsync, isLoading等属性的mutation对象
 */
export function useConsumeCredits() {
  // 获取QueryClient实例，用于操作缓存
  const queryClient = useQueryClient();

  return useMutation({
    /**
     * mutation执行函数
     * @param params - 消费参数
     * @param params.amount - 消费积分数量
     * @param params.description - 消费描述
     * @returns 服务器响应数据
     */
    mutationFn: async ({
      amount,
      description,
    }: {
      amount: number;
      description: string;
    }) => {
      // 调用服务器端消费积分操作
      const result = await consumeCreditsAction({
        amount,
        description,
      });

      // 错误处理
      if (!result?.data?.success) {
        console.error('useConsumeCredits error:', result?.data?.error);
        throw new Error(result?.data?.error || 'Failed to consume credits');
      }

      return result.data; // 返回成功响应
    },

    /**
     * 成功回调：当mutation成功后自动执行
     * 用于使相关查询缓存失效，触发重新获取最新数据
     */
    onSuccess: () => {
      // 使积分余额查询缓存失效，触发重新获取
      queryClient.invalidateQueries({
        queryKey: creditsKeys.balance(),
      });

      // 使积分统计查询缓存失效，触发重新获取
      queryClient.invalidateQueries({
        queryKey: creditsKeys.stats(),
      });

      // 注意：这里没有使transactions缓存失效，因为：
      // 1. 交易记录通常分页显示，全部失效成本高
      // 2. 用户通常在新页面查看交易记录，会获取最新数据
    },
  });
}

/**
 * 获取积分交易记录的React Query hook
 * 支持分页、搜索和排序功能，使用keepPreviousData优化用户体验
 * @param pageIndex - 当前页码（从0开始）
 * @param pageSize - 每页显示条数
 * @param search - 搜索关键字
 * @param sorting - 排序规则数组
 * @returns {QueryResult} 包含交易记录和总数的查询结果
 */
export function useCreditTransactions(pageIndex: number, pageSize: number, search: string, sorting: SortingState) {
  return useQuery({
    // 查询键：包含所有过滤参数，确保不同查询条件有独立缓存
    queryKey: creditsKeys.transactionsList({
      pageIndex,
      pageSize,
      search,
      sorting,
    }),

    queryFn: async () => {
      // 调用服务器端操作获取交易记录
      const result = await getCreditTransactionsAction({
        pageIndex,
        pageSize,
        search,
        sorting,
      });

      // 错误处理
      if (!result?.data?.success) {
        console.error('useCreditTransactions error:', result?.data?.error);
        throw new Error(result?.data?.error || 'Failed to fetch credit transactions');
      }

      // 返回结构化的交易数据
      return {
        items: result.data.data?.items || [], // 当前页的交易记录数组
        total: result.data.data?.total || 0, // 符合条件的总记录数
      };
    },

    /**
     * keepPreviousData: 保持先前数据
     * 当查询参数变化时，保持显示旧数据直到新数据加载完成
     * 避免分页/搜索/排序时的UI闪烁
     */
    placeholderData: keepPreviousData,

    // 交易记录实时性要求不高，设置短缓存
    staleTime: 1000 * 5,
  });
}
