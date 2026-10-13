# -*- coding: utf-8 -*-
"""
壁画展示系统 · 本地服务
零依赖（仅用 Python 标准库），双击启动脚本即可运行
"""
import os, sys, json, sqlite3, webbrowser, threading, mimetypes
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, unquote
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_CANDIDATES = [
    os.path.join(BASE_DIR, "壁画数据库.db"),
    
]
IMAGE_DIR = os.path.join(BASE_DIR, "壁画图片")
PORT = 8080
HOST = "127.0.0.1"
def find_db():
    for p in DB_CANDIDATES:
        if os.path.isfile(p):
            return p
    return None
def query_murals():
    db = find_db()
    if not db:
        return []
    conn = sqlite3.connect(db)
    conn.row_factory = sqlite3.Row
    try:
        rows = conn.execute(
            "SELECT id,name,dynasty,description,site,category,confidence,"
            "image_name,image_path,image_exists FROM murals ORDER BY id").fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()
class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass
    def _send(self, code, body, ctype="text/html; charset=utf-8"):
        if isinstance(body, str):
            body = body.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(body)
    def do_GET(self):
        path = unquote(urlparse(self.path).path)
        if path in ("/", "/index.html"):
            html = INDEX_HTML.replace("__DATA__", json.dumps(query_murals(), ensure_ascii=False))
            return self._send(200, html)
        if path == "/api/murals":
            return self._send(200, json.dumps(query_murals(), ensure_ascii=False),
                              "application/json; charset=utf-8")
        if path.startswith("/image/"):
            fname = os.path.basename(path[len("/image/"):])
            fpath = os.path.join(IMAGE_DIR, fname)
            if os.path.isfile(fpath):
                ctype = mimetypes.guess_type(fpath)[0] or "image/jpeg"
                with open(fpath, "rb") as f:
                    return self._send(200, f.read(), ctype)
            return self._send(404, "图片不存在", "text/plain; charset=utf-8")
        return self._send(404, "页面不存在", "text/plain; charset=utf-8")
INDEX_HTML = r"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>壁画展示系统</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
    background-attachment: fixed; min-height: 100vh; padding: 32px 20px 60px; }
  header { text-align: center; margin-bottom: 32px; color: #fff; }
  header h1 { font-size: 38px; letter-spacing: 4px; text-shadow: 0 4px 16px rgba(0,0,0,.25); margin-bottom: 10px; }
  header p { font-size: 15px; opacity: .92; }
  .stats { display: flex; justify-content: center; gap: 16px; margin-top: 18px; flex-wrap: wrap; }
  .stat { background: rgba(255,255,255,.22); backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,.35); border-radius: 14px;
    padding: 10px 22px; color: #fff; font-size: 14px; }
  .stat b { font-size: 20px; display: block; margin-bottom: 2px; }
  .filter { display: flex; justify-content: center; gap: 10px; margin: 24px 0 30px; flex-wrap: wrap; }
  .filter button { background: rgba(255,255,255,.2); backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,.4); color: #fff; padding: 8px 22px;
    border-radius: 22px; cursor: pointer; font-size: 14px; transition: all .25s; font-family: inherit; }
  .filter button:hover { background: rgba(255,255,255,.35); transform: translateY(-2px); }
  .filter button.active { background: #fff; color: #764ba2; font-weight: bold; box-shadow: 0 6px 18px rgba(0,0,0,.2); }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
    gap: 24px; max-width: 1440px; margin: 0 auto; }
  .card { background: rgba(255,255,255,.82); backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,.7); border-radius: 20px; overflow: hidden;
    box-shadow: 0 10px 32px rgba(0,0,0,.18); transition: transform .3s, box-shadow .3s;
    display: flex; flex-direction: column; }
  .card:hover { transform: translateY(-8px); box-shadow: 0 18px 44px rgba(0,0,0,.28); }
  .img-box { position: relative; height: 250px; overflow: hidden; background: #e8e0d5; cursor: zoom-in; }
  .img-box img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s; display: block; }
  .card:hover .img-box img { transform: scale(1.08); }
  .badge { position: absolute; top: 12px; left: 12px; color: #fff; font-size: 12px;
    padding: 4px 12px; border-radius: 12px; backdrop-filter: blur(6px); font-weight: bold; }
  .badge.cn { background: rgba(46,125,50,.88); }
  .badge.world { background: rgba(141,110,99,.88); }
  .num { position: absolute; top: 12px; right: 12px; width: 30px; height: 30px;
    background: rgba(0,0,0,.5); color: #fff; border-radius: 50%; display: flex;
    align-items: center; justify-content: center; font-size: 13px; font-weight: bold;
    backdrop-filter: blur(6px); }
  .body { padding: 18px 20px 20px; flex: 1; display: flex; flex-direction: column; }
  .body h3 { font-size: 19px; color: #3e2723; margin-bottom: 8px; line-height: 1.4; }
  .meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
  .chip { font-size: 12px; padding: 3px 10px; border-radius: 10px;
    background: rgba(118,75,162,.12); color: #5e35b1; }
  .chip.dyn { background: rgba(183,28,28,.12); color: #b71c1c; font-weight: bold; }
  .desc { font-size: 13px; color: #5d4037; line-height: 1.75; flex: 1;
    display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical;
    overflow: hidden; margin-bottom: 12px; }
  .card:hover .desc { -webkit-line-clamp: unset; }
  .foot { display: flex; justify-content: space-between; align-items: center;
    border-top: 1px solid rgba(0,0,0,.07); padding-top: 10px; }
  .site { font-size: 12px; color: #795548; }
  .zoom-tip { font-size: 11px; color: #a1887f; }
  #overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.9);
    z-index: 999; align-items: center; justify-content: center; cursor: zoom-out; animation: fade .25s; }
  @keyframes fade { from { opacity: 0 } to { opacity: 1 } }
  #overlay img { max-width: 92vw; max-height: 88vh; border-radius: 10px; box-shadow: 0 0 60px rgba(0,0,0,.8); }
  #overlay .cap { position: fixed; bottom: 24px; left: 0; right: 0; text-align: center; color: #fff; font-size: 15px; }
  #overlay .close { position: fixed; top: 20px; right: 30px; color: #fff; font-size: 32px; line-height: 1; }
  footer { text-align: center; color: rgba(255,255,255,.85); font-size: 13px; margin-top: 44px; }
</style>
</head>
<body>
<header>
  <h1>🏛 壁画展示系统</h1>
  <p>跨越千年的艺术长廊 · 中国壁画与世界壁画</p>
  <div class="stats">
    <div class="stat"><b id="s-total">0</b>作品总数</div>
    <div class="stat"><b id="s-cn">0</b>中国壁画</div>
    <div class="stat"><b id="s-world">0</b>世界壁画</div>
  </div>
</header>
<div class="filter">
  <button class="active" data-f="all">全部作品</button>
  <button data-f="中国壁画">中国壁画</button>
  <button data-f="非中国壁画">世界壁画</button>
</div>
<div class="grid" id="grid"></div>
<footer>壁画展示系统 · 数据来源：本地 SQLite 数据库</footer>
<div id="overlay" onclick="this.style.display='none'">
  <span class="close">×</span>
  <img id="bigimg" src="" alt="">
  <div class="cap" id="cap"></div>
</div>
<script>
const DATA = __DATA__;
function esc(s){ return (s||'').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function render(list){
  const g = document.getElementById('grid');
  if(!list.length){ g.innerHTML = '<p style="color:#fff;text-align:center;grid-column:1/-1">暂无数据</p>'; return; }
  g.innerHTML = list.map(d => {
    const isCn = d.category === '中国壁画';
    const imgUrl = '/image/' + encodeURIComponent(d.image_name);
    return `<div class="card">
      <div class="img-box" onclick="zoom('${imgUrl}','${esc(d.name)}')">
        <img src="${imgUrl}" alt="${esc(d.name)}" loading="lazy">
        <span class="badge ${isCn?'cn':'world'}">${isCn?'中国壁画':'世界壁画'}</span>
        <span class="num">${d.id}</span>
      </div>
      <div class="body">
        <h3>${esc(d.name)}</h3>
        <div class="meta">
          <span class="chip dyn">🏛 ${esc(d.dynasty)}</span>
          <span class="chip">${esc(d.confidence||'')}把握</span>
        </div>
        <p class="desc">${esc(d.description)}</p>
        <div class="foot">
          <span class="site">📍 ${esc(d.site||'待考')}</span>
          <span class="zoom-tip">🔍 点击放大</span>
        </div>
      </div>
    </div>`;
  }).join('');
}
function zoom(url, name){
  document.getElementById('bigimg').src = url;
  document.getElementById('cap').textContent = name;
  document.getElementById('overlay').style.display = 'flex';
}
document.addEventListener('keydown', e => {
  if(e.key === 'Escape') document.getElementById('overlay').style.display = 'none';
});
document.querySelectorAll('.filter button').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.filter button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.f;
    render(f === 'all' ? DATA : DATA.filter(d => d.category === f));
  };
});
document.getElementById('s-total').textContent = DATA.length;
document.getElementById('s-cn').textContent = DATA.filter(d => d.category === '中国壁画').length;
document.getElementById('s-world').textContent = DATA.filter(d => d.category !== '中国壁画').length;
render(DATA);
</script>
</body>
</html>"""
def open_browser():
    webbrowser.open(f"http://{HOST}:{PORT}/")
def main():
    db = find_db()
    print("=" * 56)
    print("   🏛  壁画展示系统 正在启动...")
    print("=" * 56)
    print(f"   数据库：{db or '未找到！'}")
    print(f"   图片目录：{IMAGE_DIR}")
    print(f"   访问地址：http://{HOST}:{PORT}/")
    print("=" * 56)
    if not db:
        print("   ⚠️  未找到数据库，请确认桌面上的「壁画数据库.db」")
    n = len(query_murals())
    print(f"   已加载 {n} 幅壁画作品")
    print("   💡 关闭本窗口即可停止服务")
    print()
    threading.Timer(1.2, open_browser).start()
    try:
        httpd = HTTPServer((HOST, PORT), Handler)
        httpd.serve_forever()
    except OSError as e:
        print(f"   ❌ 端口 {PORT} 被占用：{e}")
        print("   请关闭占用该端口的程序后重试")
        input("按回车键退出...")
    except KeyboardInterrupt:
        print("\n   服务已停止")
if __name__ == "__main__":
    main()
