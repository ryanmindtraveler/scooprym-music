import { retiredRouteResponse } from '@/lib/urls/retired-routes';

// 保留终止响应，旧请求不会再执行模型调用、抓取或文档搜索。
const gone = () => retiredRouteResponse(true);
export { gone as GET, gone as POST, gone as PUT, gone as PATCH, gone as DELETE, gone as HEAD, gone as OPTIONS };
