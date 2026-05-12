/**
 * Web Routes Configuration
 * Web端路由配置
 */

import { lazy } from 'react';
import { Navigate } from 'react-router-dom';

// 懒加载组件以优化性能
const WebShell = lazy(() => '../shells/WebShell.jsx');
const ScenicGuideShell = lazy(() => '../shells/ScenicGuideShell.jsx');
const ScenicAdminShell = lazy(() => '../shells/ScenicAdminShell.jsx');

// Web端路由配置
export const webRoutes = [
  {
    path: '/',
    element: <WebShell />,
    children: [
      {
        index: true,
        element: <Navigate to="/home" replace />,
      },
    ],
  },
  {
    path: '/home',
    element: <WebShell />,
  },
  {
    path: '/scenic-guide',
    element: <ScenicGuideShell />,
  },
  {
    path: '/scenic-guide/admin',
    element: <ScenicAdminShell />,
  },
  {
    path: '/settings',
    element: <WebShell />,
  },
  {
    path: '*',
    element: <Navigate to="/home" replace />,
  },
];

export default webRoutes;
