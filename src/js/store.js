(() => {
  const seedPosts = [
    { id: 'lf-001', kind: 'found', name: '校园卡', category: '证件卡片', location: '图书馆', place: '三楼自习区靠窗第 6 排长桌', happenedAt: '2026-10-07 09:20', description: '捡到一张校园卡，已交图书馆一楼服务台代管。请失主核对姓名和学号后联系。', contact: '13866001662', publisher: '李思远', status: 'open', createdAt: 1760000000000 },
    { id: 'lf-002', kind: 'lost', name: '黑色雨伞', category: '生活用品', location: '教学楼', place: '第二教学楼 305 教室', happenedAt: '2026-10-06 18:40', description: '伞柄有银色挂扣，离开教室时遗失，如有线索请联系我。', contact: '13900001234', publisher: '林金晶', status: 'open', createdAt: 1759900000000 },
    { id: 'lf-003', kind: 'found', name: 'AirPods 充电盒', category: '数码产品', location: '食堂', place: '第一食堂二楼收银台', happenedAt: '2026-10-06 12:15', description: '白色充电盒，已交食堂值班处，请凭特征领取。', contact: '13600005678', publisher: '马晨曦', status: 'open', createdAt: 1759800000000 }
  ];

  const clone = (value) => JSON.parse(JSON.stringify(value));

  function validatePost(input) {
    const required = ['kind', 'name', 'category', 'location', 'place', 'happenedAt', 'description', 'contact'];
    const missing = required.filter((key) => !String(input[key] ?? '').trim());
    if (missing.length) return { valid: false, message: '请完整填写必填信息。', missing };
    if (!/^1\d{10}$/.test(String(input.contact).trim())) return { valid: false, message: '请填写 11 位手机号码。', missing: ['contact'] };
    return { valid: true, message: '' };
  }

  function createStore(storage = window.localStorage) {
    const key = 'campus-lost-found-102401505-102401504-posts-v1';
    const read = () => {
      const raw = storage.getItem(key);
      if (!raw) return clone(seedPosts);
      try { return JSON.parse(raw); } catch { return clone(seedPosts); }
    };
    const write = (posts) => storage.setItem(key, JSON.stringify(posts));
    return {
      list(filters = {}) {
        const keyword = String(filters.keyword ?? '').trim().toLowerCase();
        return read().filter((post) => {
          const haystack = [post.name, post.category, post.location, post.place, post.description].join(' ').toLowerCase();
          return (!keyword || haystack.includes(keyword)) &&
            (!filters.kind || post.kind === filters.kind) &&
            (!filters.location || post.location === filters.location) &&
            (!filters.status || post.status === filters.status);
        }).sort((a, b) => Number(a.status === 'resolved') - Number(b.status === 'resolved') || b.createdAt - a.createdAt);
      },
      get(id) { return read().find((post) => post.id === id); },
      add(input) {
        const result = validatePost(input);
        if (!result.valid) throw new Error(result.message);
        const post = { ...input, id: 'lf-' + Date.now(), publisher: input.publisher || '林金晶', status: 'open', createdAt: Date.now() };
        const posts = read();
        posts.unshift(post);
        write(posts);
        return post;
      },
      resolve(id) {
        const posts = read();
        const post = posts.find((item) => item.id === id);
        if (!post) throw new Error('未找到该信息。');
        post.status = 'resolved';
        write(posts);
        return post;
      },
      stats() {
        const posts = read();
        const resolved = posts.filter((post) => post.status === 'resolved').length;
        return { total: posts.length, open: posts.length - resolved, resolved };
      },
      reset() { storage.removeItem(key); }
    };
  }

  function statusText(post) {
    if (post.status === 'resolved') return post.kind === 'lost' ? '已找到' : '已归还';
    return post.kind === 'lost' ? '寻找中' : '待认领';
  }

  function kindText(kind) { return kind === 'lost' ? '寻物' : '招领'; }

  window.LostFoundStore = { seedPosts, validatePost, createStore, statusText, kindText };
})();
