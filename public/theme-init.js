// Apply the saved display preference before the first styled frame.
try {
  const theme = localStorage.getItem('anwal-theme') || 'light';
  const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#111713' : '#f7f8f5');
} catch { /* Storage can be unavailable in private browsing. */ }
