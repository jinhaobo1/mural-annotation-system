/**
 * 应用运行配置。
 * 默认后端地址来自项目联调环境；可通过 ?api=http://host:8000/api 临时覆盖。
 */
(function () {
  const params = new URLSearchParams(window.location.search);
  let savedApiBase = '';
  try { savedApiBase = localStorage.getItem('mural-api-base') || ''; } catch (error) { savedApiBase = ''; }
  window.APP_CONFIG = {
    apiBase: params.get('api') || savedApiBase || 'http://192.168.197.128:8000/api',
    useMock: params.get('mock') === '1',
    appVersion: 'V8.0-api-connected',
    storageKey: 'mural-annotation-role',
    authStorageKey: 'mural-auth-session'
  };
  if (params.get('api')) {
    try { localStorage.setItem('mural-api-base', params.get('api')); } catch (error) { /* ignore */ }
  }
})();
