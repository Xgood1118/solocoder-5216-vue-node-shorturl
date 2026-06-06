import { linkStore } from '../store/link.js'
import { logStore } from '../store/log.js'

function checkExpired(link) {
  if (link.neverExpires) return false
  if (!link.expiresAt) return false
  return Date.now() > link.expiresAt
}

export function checkCodeExists(req, res, next) {
  const { code } = req.params
  const link = linkStore.getByCode(code)

  if (!link) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html><head><title>短链不存在</title>
      <style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f5f5f5}
      .box{background:#fff;padding:40px 60px;border-radius:8px;text-align:center;box-shadow:0 2px 12px rgba(0,0,0,.1)}
      h1{color:#f56c6c;margin:0 0 10px;font-size:48px}p{color:#606266;margin:0 0 20px}
      a{color:#409eff;text-decoration:none}
      </style></head><body>
      <div class="box"><h1>404</h1><p>该短链不存在</p>
      </div></body></html>
    `)
  }

  req.link = link
  next()
}

export function checkStatus(req, res, next) {
  const link = req.link

  if (link.status === 'disabled') {
    return res.status(403).send(`
      <!DOCTYPE html>
      <html><head><title>短链已停用</title>
      <style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f5f5f5}
      .box{background:#fff;padding:40px 60px;border-radius:8px;text-align:center;box-shadow:0 2px 12px rgba(0,0,0,.1)}
      h1{color:#f56c6c;margin:0 0 10px;font-size:48px}p{color:#606266;margin:0 0 20px}
      a{color:#409eff;text-decoration:none}
      </style></head><body>
      <div class="box"><h1>已停用</h1><p>该短链已停用</p>
      </div></body></html>
    `)
  }

  if (checkExpired(link)) {
    return res.status(410).send(`
      <!DOCTYPE html>
      <html><head><title>短链已过期</title>
      <style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f5f5f5}
      .box{background:#fff;padding:40px 60px;border-radius:8px;text-align:center;box-shadow:0 2px 12px rgba(0,0,0,.1)}
      h1{color:#e6a23c;margin:0 0 10px;font-size:48px}p{color:#606266;margin:0 0 20px}
      a{color:#409eff;text-decoration:none}
      </style></head><body>
      <div class="box"><h1>已过期</h1><p>该短链已过期</p>
      </div></body></html>
    `)
  }

  next()
}

export function checkPassword(req, res, next) {
  const link = req.link
  if (!link.password) return next()

  const providedPwd = req.query.pwd || req.headers['x-shorturl-password']
  if (providedPwd === link.password) return next()

  if (req.method === 'POST' && req.body?.password) {
    if (req.body.password === link.password) {
      return next()
    }
    return res.status(401).json({ error: '密码错误', needPassword: true })
  }

  return res.status(200).send(`
    <!DOCTYPE html>
    <html><head><title>需要密码</title>
    <style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f5f5f5}
    .box{background:#fff;padding:30px 40px;border-radius:8px;text-align:center;box-shadow:0 2px 12px rgba(0,0,0,.1)}
    h2{color:#303133;margin:0 0 20px}
    input{width:200px;padding:8px 12px;border:1px solid #dcdfe6;border-radius:4px;font-size:14px;margin-bottom:16px}
    button{padding:8px 20px;background:#409eff;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:14px}
    button:hover{background:#66b1ff}
    .err{color:#f56c6c;font-size:13px;margin-bottom:10px;min-height:18px}
    </style></head><body>
    <div class="box">
      <h2>该短链需要访问密码</h2>
      <div class="err" id="err"></div>
      <form id="form">
        <input type="password" id="pwd" placeholder="请输入密码" autofocus>
        <br>
        <button type="submit">确定</button>
      </form>
    </div>
    <script>
      const form = document.getElementById('form');
      const pwd = document.getElementById('pwd');
      const err = document.getElementById('err');
      form.onsubmit = function(e) {
        e.preventDefault();
        const url = location.pathname + '?pwd=' + encodeURIComponent(pwd.value);
        fetch(url, { method: 'GET', redirect: 'follow' }).then(r => {
          if (r.redirected) { location.href = r.url; }
          else { err.textContent = '密码错误'; }
        });
      };
    </script>
    </body></html>
  `)
}

export function resolveTarget(req, res, next) {
  const link = req.link

  if (link.abTest && link.abTest.enabled) {
    const weightA = link.abTest.weightA || 50
    const rand = Math.random() * 100
    const useA = rand < weightA
    const target = useA ? link.abTest.urlA : link.abTest.urlB
    req.targetUrl = target
    req.abVariant = useA ? 'a' : 'b'
  } else {
    req.targetUrl = link.url
    req.abVariant = null
  }

  next()
}

export function logVisit(req, res, next) {
  const link = req.link
  const ip = req.ip || req.connection?.remoteAddress || 'unknown'
  const ua = req.headers['user-agent'] || ''

  logStore.add({
    code: link.code,
    ip,
    userAgent: ua,
    success: true
  })

  linkStore.incrementClick(link.code, req.abVariant)

  next()
}

export function redirect(req, res) {
  res.redirect(302, req.targetUrl)
}
