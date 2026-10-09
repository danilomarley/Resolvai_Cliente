const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');

// Test-only HTTP fixtures; no real accounts, passwords or tokens are used.
(async () => {
  for (const executablePath of (process.env.PRESENTATION_BROWSERS ? JSON.parse(process.env.PRESENTATION_BROWSERS) : [undefined])) {
    const browser = await chromium.launch({ executablePath, headless: true });
    try {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      const errors = [], calls = [];
      page.on('pageerror', e => errors.push(e.message));
      const date = new Date().toISOString();
      const user = { id: '11111111-1111-4111-8111-111111111111', name: 'teste',
        email: 'cliente@example.invalid', role: 'Cliente', isActive: true, createdAt: date };
      const order = { id: '22222222-2222-4222-8222-222222222222', title: 'Pedido retornado pela API de teste',
        status: 'Pending', createdAt: date, description: 'Descrição retornada pela API de teste.' };
      const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
      const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, exp: Math.floor(Date.now()/1000)+3600, role: 'authenticated', aud: 'authenticated' })}.test-only-signature`;
      let summaryStatus = 200, empty = false;
      await page.route('**/auth/v1/**', async route => {
        const headers = { 'access-control-allow-origin': route.request().headers().origin || '*',
          'access-control-allow-methods': 'GET,POST,OPTIONS',
          'access-control-allow-headers': 'authorization,apikey,content-type,x-client-info,x-supabase-api-version' };
        if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
        assert.ok(new URL(route.request().url()).pathname.endsWith('/user'), 'unexpected Supabase operation');
        return route.fulfill({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({
          id: user.id, email: user.email, aud: 'authenticated', role: 'authenticated',
          created_at: date, app_metadata: {}, user_metadata: { name: user.name }, identities: [] }) });
      });
      await page.route('**/api/v1/**', async route => {
        const request = route.request(), pathname = new URL(request.url()).pathname;
        calls.push(pathname);
        let body, status = 200;
        if (pathname === '/api/v1/auth/login') {
          assert.deepEqual(request.postDataJSON(), { email: user.email, password: 'TestOnly123' });
          body = { accessToken: token, refreshToken: 'test-only-refresh', tokenType: 'bearer',
            expiresAtUtc: new Date(Date.now()+3600000).toISOString(), user };
        } else {
          assert.equal(request.headers().authorization, `Bearer ${token}`);
          if (pathname === '/api/v1/users/me') body = user;
          else if (pathname === '/api/v1/home/summary') {
            status = summaryStatus;
            body = status === 200 ? { orders: { total: empty ? 0 : 1, pending: empty ? 0 : 1,
              inProgress: 0, completed: 0, cancelled: 0 }, recentOrders: empty ? [] : [order] } : {};
          } else if (pathname === `/api/v1/orders/${order.id}`) body = order;
          else { status = 404; body = {}; }
        }
        await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
      });
      await page.goto(`${process.env.RESOLVAI_TEST_URL || 'http://127.0.0.1:5173'}/login`);
      assert.equal(await page.locator('.demo-banner').count(), 0);
      await page.getByLabel('E-mail', { exact: true }).fill(user.email);
      await page.getByLabel('Senha', { exact: true }).fill('TestOnly123');
      await page.getByRole('button', { name: 'Entrar', exact: true }).click();
      await page.getByRole('heading', { name: /Olá, teste/ }).waitFor();
      assert.equal(await page.getByText(/Ygor Chagas|Infiltração na laje do quarto/).count(), 0);
      assert.ok(calls.includes('/api/v1/auth/login'));
      assert.ok(calls.includes('/api/v1/users/me'));
      assert.ok(calls.includes('/api/v1/home/summary'));
      await page.locator('.sidebar').getByRole('button', { name: 'Meus pedidos', exact: true }).click();
      await page.getByRole('heading', { name: new RegExp(order.title) }).waitFor();
      assert.equal(await page.locator('.my-orders-list article').count(), 1);
      await page.getByRole('link', { name: `Ver detalhes do pedido ${order.id}` }).click();
      await page.getByText(order.description, { exact: true }).waitFor();
      assert.ok(calls.includes(`/api/v1/orders/${order.id}`));
      await page.getByRole('link', { name: 'Voltar para meus pedidos' }).click();
      empty = true;
      await page.reload();
      await page.getByRole('heading', { name: 'Você ainda não tem pedidos', exact: true }).waitFor();
      assert.equal(await page.locator('.my-orders-list article').count(), 0);
      summaryStatus = 401;
      await page.reload();
      await page.getByRole('heading', { name: 'Não foi possível carregar sua conta', exact: true }).waitFor();
      assert.equal(await page.getByText(/Ygor Chagas|Infiltração na laje do quarto/).count(), 0);
      assert.equal(await page.locator('.my-orders-list article').count(), 0);
      assert.deepEqual(errors, []);
      console.log('PASS integrated account: API login, profile name, Bearer, own orders, API details, empty account and 401 without demo fallback — ' + executablePath);
    } finally { await browser.close(); }
  }
})().catch(e => { console.error(e); process.exit(1); });
