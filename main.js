/**
 * MinaTech LP - メインスクリプト
 * 物件データの動的表示、フォーム送信、UI制御
 */

document.addEventListener('DOMContentLoaded', function() {

    // ======== ヘッダー スクロール ========
    const header = document.querySelector('.header');
    window.addEventListener('scroll', function() {
        header.classList.toggle('scrolled', window.scrollY > 10);
    });

    // ======== モバイルナビ ========
    const navToggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.nav');
    if (navToggle) {
        navToggle.addEventListener('click', function() {
            nav.classList.toggle('open');
        });
        // リンククリックで閉じる
        nav.querySelectorAll('a').forEach(function(link) {
            link.addEventListener('click', function() {
                nav.classList.remove('open');
            });
        });
    }

    // ======== 物件データ読み込み ========
    loadProperties();

    // ======== フォーム送信 ========
    var form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleFormSubmit(form);
        });
    }

    // ======== スムーズスクロール（Safari対応） ========
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            var target = document.querySelector(this.getAttribute('href'));
            if (target) {
                var offset = header.offsetHeight + 16;
                var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({ top: top, behavior: 'smooth' });
            }
        });
    });
});


/**
 * 物件データをJSONから読み込んで表示
 */
function loadProperties() {
    var container = document.getElementById('property-list');
    var emptyMsg = document.getElementById('property-empty');
    var statEl = document.getElementById('stat-properties');

    fetch('properties.json')
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (!data || data.length === 0) {
                if (emptyMsg) emptyMsg.style.display = 'block';
                if (statEl) statEl.textContent = '0';
                return;
            }

            if (statEl) statEl.textContent = data.length;

            data.forEach(function(p) {
                var card = createPropertyCard(p);
                container.appendChild(card);
            });
        })
        .catch(function() {
            if (emptyMsg) emptyMsg.style.display = 'block';
            if (statEl) statEl.textContent = '0';
        });
}


/**
 * 物件カードHTML生成
 */
function createPropertyCard(p) {
    var card = document.createElement('div');
    card.className = 'property-card';

    var rank = p['優先度'] || p['推奨度'] || '';
    var rankClass = 'rank-a';
    var rankLabel = 'A';
    if (rank.indexOf('S') === 0) {
        rankClass = 'rank-s';
        rankLabel = 'S';
    }

    var name = escapeHtml(p['物件名'] || p['案件名'] || '物件名未定');
    var price = p['価格(万円)'] || '-';
    var yieldVal = p['表面利回り(%)'] || '-';
    var location = escapeHtml(p['所在地'] || '-');
    var area = p['面積(㎡)'] || p['面積'] || '-';
    var structure = escapeHtml(p['構造'] || '-');
    var score = p['スコア'] || '-';
    var reason = escapeHtml(p['判断根拠'] || '');
    var url = p['物件URL'] || '#contact';

    card.innerHTML =
        '<div class="property-header">' +
            '<span class="property-rank ' + rankClass + '">' + rankLabel + '評価 (スコア: ' + score + '/10)</span>' +
            '<h3 class="property-name">' + name + '</h3>' +
        '</div>' +
        '<div class="property-body">' +
            '<dl class="property-info">' +
                '<dt>価格</dt><dd class="price">' + price + '万円</dd>' +
                '<dt>表面利回り</dt><dd class="yield">' + yieldVal + '%</dd>' +
                '<dt>所在地</dt><dd>' + location + '</dd>' +
                '<dt>面積</dt><dd>' + area + '</dd>' +
            '</dl>' +
        '</div>' +
        '<div class="property-footer">' +
            '<span>' + reason + '</span>' +
            '<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener" style="color:var(--primary-light);font-weight:700;text-decoration:none;">詳細を見る</a>' +
        '</div>';

    return card;
}


/**
 * フォーム送信処理
 * Google FormsまたはMailtoにフォールバック
 */
function handleFormSubmit(form) {
    var name = form.querySelector('#name').value;
    var email = form.querySelector('#email').value;
    var phone = form.querySelector('#phone').value;
    var budget = form.querySelector('#budget').value;
    var message = form.querySelector('#message').value;

    // mailto フォールバック（Google Forms未設定時）
    var subject = encodeURIComponent('[MinaTech LP] ' + name + '様からのお問い合わせ');
    var body = encodeURIComponent(
        'お名前: ' + name + '\n' +
        'メール: ' + email + '\n' +
        '電話: ' + phone + '\n' +
        'ご予算: ' + budget + '\n\n' +
        'ご相談内容:\n' + message
    );

    window.location.href = 'mailto:isoya.h@minatech1210.com?subject=' + subject + '&body=' + body;

    // 送信完了表示
    var btn = form.querySelector('.btn-submit');
    btn.textContent = '送信しました';
    btn.style.background = '#27ae60';
    setTimeout(function() {
        btn.textContent = '無料で相談する';
        btn.style.background = '';
    }, 3000);
}


/**
 * HTMLエスケープ
 */
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
