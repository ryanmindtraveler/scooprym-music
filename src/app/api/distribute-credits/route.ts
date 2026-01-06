// 导入积分分发功能和Next.js响应工具
import { distributeCreditsToAllUsers } from '@/credits/distribute';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * 基础认证中间件函数
 * 验证HTTP Basic Authentication，保护定时任务接口
 *
 * @param request - HTTP请求对象
 * @returns 认证是否通过（布尔值）
 */
function validateBasicAuth(request: Request): boolean {
  // 从请求头获取Authorization字段
  const authHeader = request.headers.get('authorization');

  // 检查认证头是否存在且格式正确（必须以 Basic "开头）
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  // 解析Base64编码的认证凭证
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':'); // 格式：username:password

  // 从环境变量获取预期的认证凭证
  const expectedUsername = process.env.CRON_JOBS_USERNAME;
  const expectedPassword = process.env.CRON_JOBS_PASSWORD;

  // 检查环境变量是否已配置
  if (!expectedUsername || !expectedPassword) {
    console.error('Basic auth credentials not configured in environment variables');
    return false;
  }

  // 验证用户名和密码是否匹配
  return username === expectedUsername && password === expectedPassword;
}

/**
 * GET请求处理函数：为所有用户分发积分（每日定时任务）
 *
 * 主要功能：
 * 1. 验证HTTP Basic Authentication
 * 2. 调用积分分发函数为所有用户添加积分
 * 3. 返回分发结果的统计信息
 *
 * 典型使用场景：通过cron job或定时任务调度器每日调用此接口
 */
export async function GET(request: Request) {
  // 第一步：验证HTTP Basic Authentication
  if (!validateBasicAuth(request)) {
    console.error('distribute credits unauthorized');
    // 返回401未授权响应，并添加WWW-Authenticate头部
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"', // 提示客户端需要基础认证
      },
    });
  }

  // 第二步：记录任务开始日志
  console.log('route: distribute credits start');

  // 第三步：执行积分分发核心逻辑
  const { usersCount, processedCount, errorCount } = await distributeCreditsToAllUsers();

  // 第四步：记录任务完成日志并返回统计结果
  console.log(
    `route: distribute credits end, users: ${usersCount}, processed: ${processedCount}, errors: ${errorCount}`
  );

  // 返回JSON格式的成功响应
  return NextResponse.json({
    message: `distribute credits success, users: ${usersCount}, processed: ${processedCount}, errors: ${errorCount}`,
    usersCount, // 总用户数
    processedCount, // 成功处理的用户数
    errorCount, // 处理失败的次数
  });
}
