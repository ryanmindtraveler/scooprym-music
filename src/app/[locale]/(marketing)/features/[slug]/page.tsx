import { notFound } from 'next/navigation';

// 旧功能页已弃用，没有等价替代页；在发送响应头前返回真实 404。
export function generateMetadata() {
  notFound();
}

export default function RetiredFeaturePage() {
  notFound();
}
