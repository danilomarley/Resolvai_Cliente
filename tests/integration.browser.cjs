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
      const order = { id: 'abcdef12-2222-4222-8222-222222222222', title: 'Pedido retornado pela API de teste',
        status: 'Completed', createdAt: date, updatedAt: date, description: 'Descrição retornada pela API de teste.' };
      const olderOrder = { ...order, id: '33333333-3333-4333-8333-333333333333', title: 'Pedido fora dos recentes', description: 'Detalhe fora da lista recente.' };
      const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
      const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, exp: Math.floor(Date.now()/1000)+3600, role: 'authenticated', aud: 'authenticated' })}.test-only-signature`;
      let summaryStatus = 200, detailStatus = 200, profileStatus = 200, registrationStatus = 200, empty = false;
      const registrations = [];
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
          if (pathname === '/api/v1/users/me') { status = profileStatus; body = status === 200 ? user : {}; }
          else if (pathname === '/api/v1/users/me/complete-registration') {
            assert.equal(request.method(), 'POST');
            const payload = request.postDataJSON();
            registrations.push(payload);
            status = registrationStatus;
            if (status === 200) user.cpf = payload.cpf;
            body = status === 200 ? user : {};
          }
          else if (pathname === '/api/v1/home/summary') {
            status = summaryStatus;
            body = status === 200 ? { orders: { total: empty ? 0 : 2, pending: 0,
              inProgress: 0, completed: empty ? 0 : 2, cancelled: 0 }, recentOrders: empty ? [] : [order] } : {};
          } else if (pathname === '/api/v1/orders') {
            const query = new URL(request.url()).searchParams;
            assert.equal(query.get('page'), '1');
            assert.equal(query.get('pageSize'), '10');
            body = { items: empty ? [] : [order, olderOrder], page: 1, pageSize: 10, totalItems: empty ? 0 : 2, totalPages: empty ? 0 : 1 };
          } else if (pathname.toLowerCase() === `/api/v1/orders/${order.id}`) { status = detailStatus; body = status === 200 ? order : {}; }
          else if (pathname === `/api/v1/orders/${olderOrder.id}`) body = olderOrder;
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
      await page.getByRole('heading', { name: 'Meus pedidos', exact: true }).waitFor();
      await page.getByRole('heading', { name: new RegExp(order.title) }).waitFor();
      assert.equal(await page.locator('.my-orders-list article').count(), 2);
      assert.ok(calls.includes('/api/v1/orders'));
      await page.getByRole('searchbox', { name: 'Buscar pedido' }).fill('  Pedido retornado  ');
      assert.equal(await page.locator('.my-orders-list article').count(), 1);
      await page.getByRole('searchbox', { name: 'Buscar pedido' }).fill('');
      assert.equal(await page.locator('.status-badge.completed').count(), 2);
      await page.getByRole('link', { name: `Ver detalhes do pedido ${order.id}` }).click();
      await page.getByText(order.description, { exact: true }).waitFor();
      await page.getByText('Última atualização', { exact: true }).waitFor();
      assert.equal(await page.getByText(/Produtos solicitados|Valor total|Localização não informada/).count(), 0);
      assert.ok(calls.includes(`/api/v1/orders/${order.id}`));
      assert.equal(calls.filter(path => path === '/api/v1/home/summary').length, 1);
      const baseUrl = new URL(page.url()).origin;
      await page.goto(`${baseUrl}/pedidos/${order.id.toUpperCase()}`);
      await page.getByText(order.description, { exact: true }).waitFor();
      await page.goto(`${baseUrl}/pedidos/${olderOrder.id}`);
      await page.getByText(olderOrder.description, { exact: true }).waitFor();
      detailStatus = 500;
      await page.goto(`${baseUrl}/pedidos/${order.id}`);
      await page.getByRole('alert').waitFor();
      assert.equal(await page.getByText(order.description, { exact: true }).count(), 0);
      detailStatus = 200;
      await page.getByRole('button', { name: 'Tentar novamente' }).click();
      await page.getByText(order.description, { exact: true }).waitFor();
      detailStatus = 404;
      await page.reload();
      await page.getByRole('heading', { name: 'Pedido não encontrado', exact: true }).waitFor();
      assert.equal(await page.getByText(order.description, { exact: true }).count(), 0);
      detailStatus = 401;
      await page.reload();
      await page.getByRole('link', { name: 'Entrar novamente', exact: true }).click();
      await page.getByLabel('E-mail', { exact: true }).fill(user.email);
      await page.getByLabel('Senha', { exact: true }).fill('TestOnly123');
      detailStatus = 200;
      await page.getByRole('button', { name: 'Entrar', exact: true }).click();
      await page.getByText(order.description, { exact: true }).waitFor();
      assert.equal(new URL(page.url()).pathname, `/pedidos/${order.id}`);
      await page.getByRole('link', { name: 'Voltar para meus pedidos' }).click();
      empty = true;
      await page.reload();
      await page.getByRole('heading', { name: 'Você ainda não tem pedidos', exact: true }).waitFor();
      assert.equal(await page.locator('.my-orders-list article').count(), 0);
      profileStatus = 500;
      await page.getByRole('button', { name: 'Abrir meu perfil', exact: true }).click();
      const settings = page.getByRole('dialog', { name: 'Configurações da conta', exact: true });
      await settings.getByRole('alert').waitFor();
      profileStatus = 200;
      await settings.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
      await settings.getByText(user.email, { exact: true }).waitFor();
      await settings.getByText('Pendente de finalização', { exact: true }).waitFor();
      await settings.getByRole('button', { name: 'Finalizar cadastro', exact: true }).click();
      assert.equal(registrations.length, 0, 'required fields must prevent POST');
      await settings.getByLabel('CPF', { exact: true }).fill('123.456.789-01');
      await settings.getByLabel('CEP', { exact: true }).fill('60000-000');
      await settings.getByLabel('Logradouro', { exact: true }).fill('Rua de teste');
      await settings.getByLabel('Número', { exact: true }).fill('10');
      await settings.getByLabel('Bairro', { exact: true }).fill('Centro');
      await settings.getByLabel('Cidade', { exact: true }).fill('Fortaleza');
      await settings.getByLabel('Estado', { exact: true }).selectOption('CE');
      await settings.getByLabel('Tipo de contato', { exact: true }).selectOption('email_alt');
      await settings.getByLabel('E-mail alternativo', { exact: true }).fill('alternativo@example.invalid');
      registrationStatus = 400;
      await settings.getByRole('button', { name: 'Finalizar cadastro', exact: true }).click();
      await settings.getByText('Confira o CPF, o endereço e o contato informados.', { exact: true }).waitFor();
      assert.equal(await settings.getByLabel('Logradouro', { exact: true }).inputValue(), 'Rua de teste');
      registrationStatus = 200;
      await page.setViewportSize({ width: 390, height: 844 });
      assert.equal(await settings.evaluate(el => el.scrollWidth > el.clientWidth), false, 'settings overflow on mobile');
      await settings.getByRole('button', { name: 'Finalizar cadastro', exact: true }).click();
      await settings.getByText('Cadastro finalizado com sucesso.', { exact: true }).waitFor();
      assert.deepEqual(registrations.at(-1), { name: user.name, cpf: '12345678901',
        endereco: { logradouro: 'Rua de teste', numero: '10', bairro: 'Centro', cidade: 'Fortaleza', estado: 'CE', cep: '60000000' },
        contato: { tipo: 'email_alt', valor: 'alternativo@example.invalid' } });
      assert.equal(await settings.getByRole('button', { name: 'Finalizar cadastro', exact: true }).count(), 0);
      await settings.getByRole('button', { name: 'Fechar janela', exact: true }).click();
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.getByRole('button', { name: `Abrir perfil de ${user.name}`, exact: true }).click();
      await settings.getByText('Finalizado', { exact: true }).waitFor();
      assert.equal(await settings.getByLabel('CPF', { exact: true }).count(), 0);
      await settings.getByRole('button', { name: 'Fechar janela', exact: true }).click();
      summaryStatus = 401;
      await page.reload();
      await page.getByRole('heading', { name: 'Não foi possível carregar sua conta', exact: true }).waitFor();
      assert.equal(await page.getByText(/Ygor Chagas|Infiltração na laje do quarto/).count(), 0);
      assert.equal(await page.locator('.my-orders-list article').count(), 0);
      assert.deepEqual(errors, []);
      console.log('PASS integrated account: orders, errors, relogin, settings via avatar/name, profile retry, registration validation, 400/retry, exact payload, completed state and mobile layout — ' + executablePath);
    } finally { await browser.close(); }
  }
})().catch(e => { console.error(e); process.exit(1); });
