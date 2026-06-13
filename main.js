/**
 * Shonan Minato REAL ESTATE - Main Script
 * - Shared header/footer injection
 * - Hero slideshow
 * - Scroll-based header style
 * - Property rendering from JSON
 * - Mobile menu toggle
 */

(function () {
    'use strict';

    const SITE = {
        name: 'Shonan Minato REAL ESTATE',
        nameFull: 'MinaTech株式会社',
        tel: '0467-28-7603',
        email: 'isoya.h@minatech1210.com',
        address: '〒251-0055 神奈川県藤沢市南藤沢3-12 クリオ藤沢駅前 7階',
        license: '宅地建物取引業：神奈川県知事（1）第32624号',
        ceo: '代表取締役 磯谷 肇',
        line: {
            id: '@760zrvim',
            addUrl: 'https://lin.ee/SnaIIqa',
            qr: 'https://qr-official.line.me/gs/M_760zrvim_BW.png'
        }
    };

    // ============================================
    // Header / Navigation
    // ============================================
    function injectHeader() {
        const el = document.getElementById('site-header');
        if (!el) return;
        el.innerHTML = `
            <div class="header-inner">
                <a href="./" class="header-logo">
                    <img src="logo.svg" alt="Shonan Minato REAL ESTATE">
                </a>
                <nav class="nav-main" id="nav-main">
                    <a href="properties.html">Properties</a>
                    <a href="area/fujisawa.html">Area</a>
                    <a href="market.html">Market</a>
                    <a href="sell.html">Sell</a>
                    <a href="blog.html">Column</a>
                    <a href="faq.html">FAQ</a>
                    <a href="about.html">About</a>
                    <a href="contact.html">Contact</a>
                    <a href="oheya.html" class="nav-cta">お部屋探し相談</a>
                </nav>
                <button class="menu-toggle" id="menu-toggle" aria-label="menu">
                    <span></span><span></span><span></span>
                </button>
            </div>
        `;
        const toggle = document.getElementById('menu-toggle');
        const nav = document.getElementById('nav-main');
        toggle?.addEventListener('click', () => nav.classList.toggle('open'));
    }

    function injectFooter() {
        const el = document.getElementById('site-footer');
        if (!el) return;
        const year = new Date().getFullYear();
        el.innerHTML = `
            <div class="container">
                <div class="footer-grid">
                    <div>
                        <div class="footer-logo">
                            <img src="logo.svg" alt="${SITE.name}">
                        </div>
                        <p class="footer-about">
                            湘南から、資産と暮らしをデザインする。<br>
                            湘南・横浜・東京エリアで、住宅・投資・法人向け不動産を取り扱う総合不動産会社。
                        </p>
                        <p class="footer-license">
                            ${SITE.nameFull}<br>
                            ${SITE.address}<br>
                            ${SITE.license}<br>
                            TEL: ${SITE.tel}
                        </p>
                    </div>
                    <div>
                        <div class="footer-title">Services</div>
                        <ul class="footer-nav">
                            <li><a href="properties.html?cat=residence">住宅売買</a></li>
                            <li><a href="properties.html?cat=investment">投資物件</a></li>
                            <li><a href="properties.html?cat=luxury">富裕層向け</a></li>
                            <li><a href="properties.html?cat=commercial">法人・テナント</a></li>
                            <li><a href="sell.html">売却査定</a></li>
                        </ul>
                    </div>
                    <div>
                        <div class="footer-title">Information</div>
                        <ul class="footer-nav">
                            <li><a href="blog.html">コラム</a></li>
                            <li><a href="faq.html">よくあるご質問</a></li>
                            <li><a href="area/fujisawa.html">藤沢市の不動産</a></li>
                            <li><a href="area/chigasaki.html">茅ヶ崎市の不動産</a></li>
                            <li><a href="area/kamakura.html">鎌倉市の不動産</a></li>
                        </ul>
                    </div>
                    <div>
                        <div class="footer-title">Company</div>
                        <ul class="footer-nav">
                            <li><a href="about.html">会社概要</a></li>
                            <li><a href="market.html">市場データ</a></li>
                            <li><a href="contact.html">お問い合わせ</a></li>
                        </ul>
                    </div>
                    <div>
                        <div class="footer-title">Contact</div>
                        <ul class="footer-nav">
                            <li><a href="tel:${SITE.tel}">${SITE.tel}</a></li>
                            <li><a href="mailto:${SITE.email}">${SITE.email}</a></li>
                            <li><a href="${SITE.line.addUrl}" target="_blank" rel="noopener">LINE公式 ${SITE.line.id}</a></li>
                            <li style="color: var(--gray-500); font-size: 0.75rem;">年中無休 10:00〜21:00</li>
                        </ul>
                    </div>
                </div>
                <div class="footer-legal" style="border-top:1px solid rgba(255,255,255,0.08);margin-top:1.5rem;padding-top:1rem;text-align:center;">
                    <a href="privacy.html" style="color:var(--gray-500);font-size:0.78rem;margin:0 12px;">プライバシーポリシー</a>
                    <a href="terms.html" style="color:var(--gray-500);font-size:0.78rem;margin:0 12px;">利用規約</a>
                    <a href="tokushoho.html" style="color:var(--gray-500);font-size:0.78rem;margin:0 12px;">特定商取引法に基づく表記</a>
                </div>
                <div class="footer-bottom">
                    © ${year} ${SITE.name} (${SITE.nameFull}) — All Rights Reserved.
                </div>
            </div>
        `;
    }

    // ============================================
    // Contact form: Ajax 送信 + 成功/失敗 UI フィードバック
    // ============================================
    function initContactForm() {
        const form = document.getElementById('contact-form');
        if (!form || !form.action || form.action.indexOf('formspree') < 0) return;
        const submitBtn = form.querySelector('button[type="submit"]');
        const note = form.querySelector('.form-note');
        let statusEl = form.querySelector('.form-status');
        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.className = 'form-status';
            statusEl.style.cssText = 'margin-top:1rem;padding:14px 18px;border-radius:6px;font-size:0.9rem;display:none;';
            form.appendChild(statusEl);
        }

        function showStatus(type, msg) {
            statusEl.style.display = 'block';
            if (type === 'success') {
                statusEl.style.background = '#ecfdf5';
                statusEl.style.color = '#065f46';
                statusEl.style.border = '1px solid #10b981';
            } else if (type === 'error') {
                statusEl.style.background = '#fef2f2';
                statusEl.style.color = '#991b1b';
                statusEl.style.border = '1px solid #dc2626';
            } else {
                statusEl.style.background = '#eff6ff';
                statusEl.style.color = '#1e40af';
                statusEl.style.border = '1px solid #3b82f6';
            }
            statusEl.textContent = msg;
        }

        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const orig = submitBtn ? submitBtn.textContent : '';
            if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '送信中…'; }
            showStatus('info', '送信中です。しばらくお待ちください…');
            try {
                const data = new FormData(form);
                const res = await fetch(form.action, {
                    method: 'POST',
                    body: data,
                    headers: { 'Accept': 'application/json' }
                });
                if (res.ok) {
                    showStatus('success', '送信が完了しました。1〜2営業日以内にご返信いたします。');
                    form.reset();
                } else {
                    let errMsg = '送信に失敗しました。';
                    try {
                        const j = await res.json();
                        if (j && j.errors && j.errors.length) {
                            errMsg += ' ' + j.errors.map(e => e.message).join(' / ');
                        }
                    } catch (_) {}
                    showStatus('error', errMsg + ' お電話（0467-28-7603）またはメール（isoya.h@minatech1210.com）でも受け付けております。');
                }
            } catch (err) {
                showStatus('error', '通信エラーが発生しました。インターネット接続をご確認のうえ再度お試しください。お電話（0467-28-7603）でも承ります。');
            } finally {
                if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = orig; }
            }
        });
    }

    // ============================================
    // Header scroll behavior
    // ============================================
    function initHeaderScroll() {
        const header = document.getElementById('site-header');
        if (!header) return;
        const update = () => {
            if (window.scrollY > 40) header.classList.add('scrolled');
            else header.classList.remove('scrolled');
        };
        update();
        window.addEventListener('scroll', update, { passive: true });
    }

    // ============================================
    // Hero slideshow
    // ============================================
    function initHeroSlideshow() {
        const slides = document.querySelectorAll('.hero-slide');
        if (slides.length < 2) return;
        let idx = 0;
        slides[0].classList.add('active');
        setInterval(() => {
            slides[idx].classList.remove('active');
            idx = (idx + 1) % slides.length;
            slides[idx].classList.add('active');
        }, 6000);
    }

    // ============================================
    // Property rendering
    // ============================================
    function formatPrice(p) {
        if (!p) return '—';
        if (p.rentType === '賃貸') {
            return `${p.price.toLocaleString()}<small>${p.priceUnit}</small>`;
        }
        return `${p.price.toLocaleString()}<small>${p.priceUnit}</small>`;
    }

    function propertyCardHTML(p) {
        const badges = [];
        if (p.tags) p.tags.forEach(t => {
            let cls = 'property-badge';
            if (t === 'NEW') cls += ' new';
            if (t === 'DEMO') cls += ' demo';
            badges.push(`<span class="${cls}">${t}</span>`);
        });
        badges.push('<span class="property-badge demo">DEMO</span>');

        const specs = [];
        if (p.layout) specs.push(`<span><span class="property-spec-label">間取</span>${p.layout}</span>`);
        if (p.size) specs.push(`<span><span class="property-spec-label">面積</span>${p.size}㎡</span>`);
        if (p.yield) specs.push(`<span><span class="property-spec-label">利回り</span>${p.yield}%</span>`);
        if (p.built) specs.push(`<span><span class="property-spec-label">築年</span>${p.built}</span>`);

        return `
            <a href="property.html?id=${p.id}" class="property-card">
                <div class="property-image" style="background-image: url('${p.image}')">
                    <div class="property-badges">${badges.join('')}</div>
                </div>
                <div class="property-body">
                    <div class="property-category">${p.categoryLabel} · ${p.area}</div>
                    <div class="property-name">${p.name}</div>
                    <div class="property-price">${formatPrice(p)}</div>
                    <div class="property-specs">${specs.join('')}</div>
                </div>
            </a>
        `;
    }

    async function loadProperties() {
        try {
            const res = await fetch('data/properties-demo.json');
            const data = await res.json();
            return data.properties || [];
        } catch (e) {
            console.warn('物件データ読込失敗', e);
            return [];
        }
    }

    async function renderFeatured() {
        const target = document.getElementById('featured-properties');
        if (!target) return;
        const props = await loadProperties();
        const limit = parseInt(target.dataset.limit || '6', 10);
        const featured = props.slice(0, limit);
        target.innerHTML = featured.map(propertyCardHTML).join('');
    }

    async function renderPropertiesList() {
        const target = document.getElementById('properties-list');
        if (!target) return;
        const props = await loadProperties();
        const urlParams = new URLSearchParams(location.search);
        const initialCat = urlParams.get('cat') || 'all';

        const render = (cat) => {
            const filtered = cat === 'all' ? props : props.filter(p => p.category === cat);
            target.innerHTML = filtered.length
                ? filtered.map(propertyCardHTML).join('')
                : '<p style="grid-column: 1/-1; text-align:center; color: var(--gray-500); padding: 4rem 0;">該当する物件はありません。</p>';
        };

        const btns = document.querySelectorAll('.filter-btn');
        btns.forEach(b => {
            if (b.dataset.cat === initialCat) b.classList.add('active');
            b.addEventListener('click', () => {
                btns.forEach(x => x.classList.remove('active'));
                b.classList.add('active');
                render(b.dataset.cat);
            });
        });
        render(initialCat);
    }

    async function renderPropertyDetail() {
        const target = document.getElementById('property-detail');
        if (!target) return;
        const id = new URLSearchParams(location.search).get('id');
        const props = await loadProperties();
        const p = props.find(x => x.id === id) || props[0];
        if (!p) {
            target.innerHTML = '<p>物件が見つかりませんでした。</p>';
            return;
        }

        const specs = [
            ['カテゴリ', p.categoryJP],
            ['種別', p.subtype],
            ['所在地', p.location],
            ['交通', p.access],
            ['間取り', p.layout || '—'],
            ['建物面積', p.size ? `${p.size}㎡` : '—'],
            ['土地面積', p.landSize ? `${p.landSize}㎡` : '—'],
            ['築年月', p.built || '—'],
            ['構造', p.structure || '—']
        ];
        if (p.yield) specs.push(['表面利回り', `${p.yield}%`]);
        if (p.occupancy) specs.push(['入居状況', p.occupancy]);

        document.title = `${p.name} | Shonan Minato REAL ESTATE`;

        target.innerHTML = `
            <div class="detail-hero">
                <div class="detail-breadcrumb">
                    <a href="./">TOP</a> ／ <a href="properties.html">物件一覧</a> ／ ${p.name}
                </div>
                <div class="detail-title-row">
                    <div class="detail-category">${p.categoryLabel} — ${p.subtype}</div>
                    <h1 class="detail-name">${p.name}</h1>
                    <p class="detail-location">${p.location} ／ ${p.access}</p>
                </div>
            </div>
            <div class="detail-body">
                <div>
                    <div class="detail-main-image" style="background-image: url('${p.image}')"></div>
                    <div class="detail-description">${p.description}</div>
                    ${p.features ? `<p style="font-size: 0.85rem; color: var(--gray-500);">特徴：${p.features.join(' / ')}</p>` : ''}
                    <p style="margin-top: 2rem; padding: 1rem; background: var(--ivory); font-size: 0.8rem; color: var(--gray-500);">
                        ※本物件はサイト開設準備中のサンプル物件です。実際の取引にはご利用いただけません。
                    </p>
                </div>
                <aside class="detail-sidebar">
                    <div class="detail-price-box">
                        <div class="detail-price-label">${p.rentType || '価格'}</div>
                        <div class="detail-price-value">${p.price.toLocaleString()}<span style="font-size: 1rem; color: var(--gray-500);"> ${p.priceUnit}</span></div>
                        <div class="detail-specs">
                            ${specs.map(([k, v]) => `
                                <div class="detail-specs-row">
                                    <span class="detail-specs-label">${k}</span>
                                    <span class="detail-specs-value">${v}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="detail-contact-cta">
                        <p>この物件についてのご相談</p>
                        <a href="contact.html?prop=${p.id}" class="btn btn-primary">お問い合わせ</a>
                    </div>
                </aside>
            </div>
        `;
    }

    // ============================================
    // Market data (from scraper results)
    // ============================================
    async function renderMarketStats() {
        const target = document.getElementById('market-stats');
        if (!target) return;
        try {
            const res = await fetch('properties.json');
            const data = await res.json();
            if (!Array.isArray(data) || !data.length) return;

            const avgYield = data
                .map(p => parseFloat(p['表面利回り(%)']))
                .filter(y => !isNaN(y))
                .reduce((a, b, _, arr) => a + b / arr.length, 0);

            const prices = data.map(p => parseFloat(p['価格(万円)'])).filter(p => !isNaN(p));
            const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
            const minPrice = Math.min(...prices);
            const sScore = data.filter(p => String(p['優先度']).startsWith('S')).length;

            target.innerHTML = `
                <div class="market-stat">
                    <div class="market-stat-value">${data.length}</div>
                    <div class="market-stat-label">分析済み物件数</div>
                </div>
                <div class="market-stat">
                    <div class="market-stat-value">${avgYield.toFixed(1)}%</div>
                    <div class="market-stat-label">平均表面利回り</div>
                </div>
                <div class="market-stat">
                    <div class="market-stat-value">${minPrice.toLocaleString()}</div>
                    <div class="market-stat-label">最低価格（万円）</div>
                </div>
                <div class="market-stat">
                    <div class="market-stat-value">${sScore}</div>
                    <div class="market-stat-label">S評価物件数</div>
                </div>
            `;
        } catch (e) {
            console.warn('市場データ読込失敗', e);
        }
    }

    // ============================================
    // フローティングCTA（賃貸ヒアリングフォーム導線・全ページ共通）
    // oheya.html 自体には表示しない
    // ============================================
    function injectFloatingCTA() {
        const path = (location.pathname || '').toLowerCase();
        if (path.endsWith('/oheya.html') || path === '/oheya' || path.endsWith('oheya.html')) return;

        if (document.querySelector('.smr-fab')) return; // 二重注入防止

        const style = document.createElement('style');
        style.textContent = `
            .smr-fab{position:fixed; right:16px; bottom:18px; z-index:9999;
              display:inline-flex; align-items:center; gap:8px;
              background:#1a2940; color:#fff; text-decoration:none; font-weight:700; font-size:14px;
              padding:13px 20px; border-radius:999px; box-shadow:0 6px 20px rgba(26,41,64,.28);
              border:1px solid rgba(255,255,255,.14);}
            .smr-fab::before{content:""; width:8px; height:8px; border-radius:50%; background:#3BC0A8;}
            .smr-fab:hover{background:#22324d;}
            @media(max-width:600px){.smr-fab{right:12px; bottom:12px; padding:12px 18px; font-size:13.5px;}}
        `;
        document.head.appendChild(style);

        const a = document.createElement('a');
        a.href = '/oheya.html';
        a.className = 'smr-fab';
        a.setAttribute('aria-label', 'お部屋探し相談');
        a.textContent = 'お部屋探し相談';
        document.body.appendChild(a);
    }

    // ============================================
    // Init
    // ============================================
    document.addEventListener('DOMContentLoaded', () => {
        injectHeader();
        injectFooter();
        injectFloatingCTA();
        initHeaderScroll();
        initHeroSlideshow();
        renderFeatured();
        renderPropertiesList();
        renderPropertyDetail();
        renderMarketStats();
        initContactForm();
    });
})();
