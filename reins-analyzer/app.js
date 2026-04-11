/**
 * REINS物件解析ツール - メインアプリケーション
 * UI制御、エクスポート、全体フロー管理
 */

(function() {
    'use strict';

    // 解析済みデータの保持
    var analyzedProperties = [];

    // ======== 初期化 ========
    document.addEventListener('DOMContentLoaded', function() {
        initTabs();
        initButtons();
        initDragDrop();
    });

    // ======== タブ切り替え ========
    function initTabs() {
        var tabs = document.querySelectorAll('.tab');
        tabs.forEach(function(tab) {
            tab.addEventListener('click', function() {
                var target = this.getAttribute('data-tab');
                tabs.forEach(function(t) { t.classList.remove('active'); });
                this.classList.add('active');
                document.querySelectorAll('.tab-content').forEach(function(c) {
                    c.classList.remove('active');
                });
                document.getElementById('tab-' + target).classList.add('active');
            });
        });
    }

    // ======== ボタンイベント ========
    function initButtons() {
        // 解析ボタン
        document.getElementById('btn-parse').addEventListener('click', function() {
            var text = document.getElementById('paste-area').value;
            if (!text.trim()) {
                showToast('テキストを貼り付けてください', 'warning');
                return;
            }
            runAnalysis(text);
        });

        // サンプルボタン
        document.getElementById('btn-sample').addEventListener('click', function() {
            document.getElementById('paste-area').value = getSampleData();
            // テキスト貼り付けタブに切り替え
            document.querySelector('.tab[data-tab="paste"]').click();
            showToast('サンプルデータを入力しました', 'info');
        });

        // クリアボタン
        document.getElementById('btn-clear').addEventListener('click', function() {
            document.getElementById('paste-area').value = '';
            analyzedProperties = [];
            document.getElementById('results-section').style.display = 'none';
            showToast('クリアしました', 'info');
        });

        // 手動入力フォーム
        document.getElementById('manual-form').addEventListener('submit', function(e) {
            e.preventDefault();
            var formData = new FormData(this);
            var prop = {};
            formData.forEach(function(value, key) {
                if (value.trim()) prop[key] = value.trim();
            });

            if (Object.keys(prop).length < 2) {
                showToast('最低2項目は入力してください', 'warning');
                return;
            }

            var scored = ReinsScorer.evaluateAll([prop]);
            analyzedProperties = analyzedProperties.concat(scored);
            renderResults();
            this.reset();
            showToast('物件を追加しました（合計' + analyzedProperties.length + '件）', 'success');
        });

        // エクスポートボタン
        document.getElementById('btn-export-csv').addEventListener('click', function() {
            exportCSV();
        });
        document.getElementById('btn-export-excel').addEventListener('click', function() {
            exportExcel();
        });
        document.getElementById('btn-export-json').addEventListener('click', function() {
            exportJSON();
        });

        // テーブル切り替え
        document.getElementById('btn-table-view').addEventListener('click', function() {
            var table = document.getElementById('table-container');
            var cards = document.getElementById('property-cards');
            if (table.style.display === 'none') {
                table.style.display = 'block';
                cards.style.display = 'none';
                this.textContent = 'カード表示に切り替え';
            } else {
                table.style.display = 'none';
                cards.style.display = 'flex';
                this.textContent = 'テーブル表示に切り替え';
            }
        });
    }

    // ======== ドラッグ&ドロップ ========
    function initDragDrop() {
        var area = document.getElementById('paste-area');
        area.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('drag-over');
        });
        area.addEventListener('dragleave', function() {
            this.classList.remove('drag-over');
        });
        area.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            var files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type === 'text/plain') {
                var reader = new FileReader();
                reader.onload = function(ev) {
                    area.value = ev.target.result;
                    showToast('ファイルを読み込みました', 'info');
                };
                reader.readAsText(files[0], 'UTF-8');
            } else {
                var text = e.dataTransfer.getData('text');
                if (text) area.value = text;
            }
        });
    }

    // ======== 解析実行 ========
    function runAnalysis(text) {
        // パース
        var parsed = ReinsParser.parse(text);
        if (parsed.length === 0) {
            showToast('物件データを検出できませんでした。フォーマットを確認してください。', 'warning');
            return;
        }

        // スコアリング
        var scored = ReinsScorer.evaluateAll(parsed);
        analyzedProperties = scored;

        renderResults();
        showToast(scored.length + '件の物件を解析しました', 'success');
    }

    // ======== 結果表示 ========
    function renderResults() {
        var section = document.getElementById('results-section');
        section.style.display = 'block';

        // カウント表示
        document.getElementById('result-count').textContent =
            '（' + analyzedProperties.length + '件）';

        // ランク別カウント
        var counts = { S: 0, A: 0, B: 0, C: 0 };
        analyzedProperties.forEach(function(p) {
            var rank = p['評価ランク'] || 'C';
            if (counts[rank] !== undefined) counts[rank]++;
        });
        document.getElementById('count-s').textContent = counts.S;
        document.getElementById('count-a').textContent = counts.A;
        document.getElementById('count-b').textContent = counts.B;
        document.getElementById('count-c').textContent = counts.C;

        // カード描画
        renderCards();
        // テーブル描画
        renderTable();

        // スクロール
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ======== カード描画 ========
    function renderCards() {
        var container = document.getElementById('property-cards');
        container.innerHTML = '';

        analyzedProperties.forEach(function(p) {
            var rank = (p['評価ランク'] || 'C').toLowerCase();
            var name = escapeHtml(p['物件名'] || '物件名未定');
            var score = p['スコア'] || 0;
            var price = p['価格(万円)'] || '-';
            var yld = p['表面利回り(%)'] || '-';
            var loc = escapeHtml(p['所在地'] || '-');
            var station = escapeHtml(p['駅徒歩(分)'] || '-');
            var structure = escapeHtml(p['構造'] || '-');
            var area = p['面積(㎡)'] || p['建物面積(㎡)'] || p['土地面積(㎡)'] || '-';
            var reason = escapeHtml(p['判断根拠'] || '');
            var areaEval = escapeHtml(p['エリア評価'] || '');
            var priority = escapeHtml(p['優先度'] || '');

            var card = document.createElement('div');
            card.className = 'prop-card';
            card.innerHTML =
                '<div class="prop-card-top">' +
                    '<div class="prop-rank-badge rank-' + rank + '">' +
                        '<span class="prop-rank-letter">' + rank.toUpperCase() + '</span>' +
                        '<span class="prop-rank-score">' + score + '/10</span>' +
                    '</div>' +
                    '<div class="prop-card-body">' +
                        '<div class="prop-name">' + name + '</div>' +
                        '<div class="prop-meta">' +
                            '<div class="prop-meta-item">' +
                                '<span class="prop-meta-label">価格</span>' +
                                '<span class="prop-meta-value price">' + formatNumber(price) + '万円</span>' +
                            '</div>' +
                            '<div class="prop-meta-item">' +
                                '<span class="prop-meta-label">表面利回り</span>' +
                                '<span class="prop-meta-value yield-val">' + yld + '%</span>' +
                            '</div>' +
                            '<div class="prop-meta-item">' +
                                '<span class="prop-meta-label">所在地</span>' +
                                '<span class="prop-meta-value">' + loc + '</span>' +
                            '</div>' +
                            '<div class="prop-meta-item">' +
                                '<span class="prop-meta-label">駅</span>' +
                                '<span class="prop-meta-value">' + station + '</span>' +
                            '</div>' +
                            '<div class="prop-meta-item">' +
                                '<span class="prop-meta-label">構造</span>' +
                                '<span class="prop-meta-value">' + structure + '</span>' +
                            '</div>' +
                            '<div class="prop-meta-item">' +
                                '<span class="prop-meta-label">面積</span>' +
                                '<span class="prop-meta-value">' + area + '㎡</span>' +
                            '</div>' +
                        '</div>' +
                        '<div class="prop-reason">' +
                            '<strong>' + priority + '</strong> ' + reason +
                            (areaEval ? ' ［' + areaEval + '］' : '') +
                        '</div>' +
                    '</div>' +
                '</div>';

            container.appendChild(card);
        });
    }

    // ======== テーブル描画 ========
    function renderTable() {
        var tbody = document.getElementById('results-tbody');
        tbody.innerHTML = '';

        analyzedProperties.forEach(function(p) {
            var rank = (p['評価ランク'] || 'C');
            var tr = document.createElement('tr');
            tr.innerHTML =
                '<td><span class="rank-badge rank-' + rank.toLowerCase() + '">' + rank + '</span></td>' +
                '<td>' + (p['スコア'] || 0) + '/10</td>' +
                '<td>' + escapeHtml(p['物件名'] || '-') + '</td>' +
                '<td>' + escapeHtml(p['所在地'] || '-') + '</td>' +
                '<td>' + formatNumber(p['価格(万円)'] || '-') + '</td>' +
                '<td>' + (p['表面利回り(%)'] || '-') + '</td>' +
                '<td>' + escapeHtml(p['駅徒歩(分)'] || '-') + '</td>' +
                '<td>' + escapeHtml(p['構造'] || '-') + '</td>' +
                '<td>' + (p['面積(㎡)'] || p['建物面積(㎡)'] || '-') + '</td>' +
                '<td>' + escapeHtml(p['判断根拠'] || '-') + '</td>';
            tbody.appendChild(tr);
        });
    }

    // ======== CSV エクスポート ========
    function exportCSV() {
        if (analyzedProperties.length === 0) {
            showToast('エクスポートするデータがありません', 'warning');
            return;
        }

        var headers = getExportHeaders();
        var rows = [headers.join(',')];

        analyzedProperties.forEach(function(p) {
            var row = headers.map(function(h) {
                var val = (p[h] || '').toString();
                // CSVエスケープ: ダブルクォートとカンマ対応
                if (val.indexOf(',') >= 0 || val.indexOf('"') >= 0 || val.indexOf('\n') >= 0) {
                    val = '"' + val.replace(/"/g, '""') + '"';
                }
                return val;
            });
            rows.push(row.join(','));
        });

        var csv = '\uFEFF' + rows.join('\n'); // BOM付きUTF-8
        downloadFile(csv, 'reins_analysis_' + getDateStr() + '.csv', 'text/csv;charset=utf-8');
        showToast('CSVをダウンロードしました', 'success');
    }

    // ======== Excel エクスポート（HTML Table形式 .xls） ========
    function exportExcel() {
        if (analyzedProperties.length === 0) {
            showToast('エクスポートするデータがありません', 'warning');
            return;
        }

        var headers = getExportHeaders();

        var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
        html += '<head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>REINS物件解析</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>';
        html += '<body><table border="1">';

        // ヘッダー行
        html += '<tr>';
        headers.forEach(function(h) {
            html += '<th style="background:#005bac;color:#fff;font-weight:bold;padding:6px;">' + escapeHtml(h) + '</th>';
        });
        html += '</tr>';

        // データ行
        analyzedProperties.forEach(function(p) {
            var rank = p['評価ランク'] || 'C';
            var bgColor = rank === 'S' ? '#FFF8E1' : rank === 'A' ? '#E3F2FD' : rank === 'B' ? '#F5F5F5' : '#FFEBEE';
            html += '<tr style="background:' + bgColor + ';">';
            headers.forEach(function(h) {
                html += '<td style="padding:4px;">' + escapeHtml((p[h] || '').toString()) + '</td>';
            });
            html += '</tr>';
        });

        html += '</table></body></html>';

        downloadFile(html, 'reins_analysis_' + getDateStr() + '.xls', 'application/vnd.ms-excel;charset=utf-8');
        showToast('Excelをダウンロードしました', 'success');
    }

    // ======== JSON エクスポート ========
    function exportJSON() {
        if (analyzedProperties.length === 0) {
            showToast('エクスポートするデータがありません', 'warning');
            return;
        }

        var json = JSON.stringify(analyzedProperties, null, 2);
        downloadFile(json, 'reins_analysis_' + getDateStr() + '.json', 'application/json;charset=utf-8');
        showToast('JSONをダウンロードしました', 'success');
    }

    // ======== エクスポート用ヘッダー ========
    function getExportHeaders() {
        return [
            '評価ランク', 'スコア', '優先度', 'リスク評価',
            '物件名', '所在地', '価格(万円)', '表面利回り(%)',
            '実質利回り概算(%)', '駅徒歩(分)', '構造', '築年月', '築年数',
            '面積(㎡)', '建物面積(㎡)', '土地面積(㎡)',
            '間取り', '現況', '総戸数',
            'エリア評価', '判断根拠',
            '用途地域', '建ぺい率', '容積率', '権利', '物件種別',
            '備考'
        ];
    }

    // ======== サンプルデータ ========
    function getSampleData() {
        return [
            '物件名: 藤沢市南藤沢 一棟マンション',
            '所在地: 神奈川県藤沢市南藤沢3丁目',
            '価格: 4,800万円',
            '表面利回り: 12.5%',
            '交通: JR東海道本線 藤沢駅 徒歩5分',
            '構造: RC造 3階建',
            '築年月: 1998年6月',
            '土地面積: 120.5㎡',
            '建物面積: 280.3㎡',
            '総戸数: 6戸',
            '現況: 賃貸中（満室）',
            '用途地域: 近隣商業地域',
            '建ぺい率: 80%',
            '容積率: 300%',
            '権利: 所有権',
            '',
            '-----',
            '',
            '物件名: 横浜市中区 区分マンション',
            '所在地: 神奈川県横浜市中区山下町',
            '価格: 1,280万円',
            '表面利回り: 8.2%',
            '交通: みなとみらい線 元町・中華街駅 徒歩8分',
            '構造: SRC造 11階建 5階部分',
            '築年月: 2001年3月',
            '専有面積: 42.5㎡',
            '間取り: 1LDK',
            '現況: 賃貸中',
            '用途地域: 商業地域',
            '',
            '-----',
            '',
            '物件名: さいたま市大宮区 一棟アパート',
            '所在地: 埼玉県さいたま市大宮区三橋',
            '価格: 2,800万円',
            '表面利回り: 16.8%',
            '交通: JR大宮駅 徒歩12分',
            '構造: 木造 2階建',
            '築年月: 平成10年5月',
            '土地面積: 150.2㎡',
            '建物面積: 180.6㎡',
            '総戸数: 8戸',
            '現況: 賃貸中（1室空き）',
            '備考: 前面道路6m',
            '',
            '-----',
            '',
            '物件名: 千葉市中央区 一棟マンション',
            '所在地: 千葉県千葉市中央区新田町',
            '価格: 6,500万円',
            '表面利回り: 9.1%',
            '交通: JR千葉駅 徒歩7分',
            '構造: RC造 5階建',
            '築年月: 1992年8月',
            '建物面積: 420.5㎡',
            '土地面積: 95.3㎡',
            '総戸数: 10戸',
            '現況: 賃貸中（満室）',
            '',
            '-----',
            '',
            '物件名: 宮古市 中古戸建',
            '所在地: 岩手県宮古市田老',
            '価格: 380万円',
            '表面利回り: 22.0%',
            '交通: 三陸鉄道 田老駅 徒歩15分',
            '構造: 木造 2階建',
            '築年月: 昭和60年3月',
            '備考: 再建築不可',
        ].join('\n');
    }

    // ======== ユーティリティ ========

    function escapeHtml(str) {
        if (!str) return '';
        return str.toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function formatNumber(val) {
        if (!val || val === '-') return '-';
        var num = parseFloat(val.toString().replace(/,/g, ''));
        if (isNaN(num)) return val;
        return num.toLocaleString();
    }

    function getDateStr() {
        var d = new Date();
        return d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0');
    }

    function downloadFile(content, filename, mimeType) {
        var blob = new Blob([content], { type: mimeType });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // トースト通知
    function showToast(message, type) {
        // 既存のトーストを削除
        var existing = document.querySelector('.toast');
        if (existing) existing.remove();

        var toast = document.createElement('div');
        toast.className = 'toast toast-' + (type || 'info');
        toast.textContent = message;
        toast.style.cssText = 'position:fixed;bottom:24px;right:24px;padding:12px 24px;' +
            'border-radius:8px;color:#fff;font-size:14px;font-weight:600;z-index:9999;' +
            'animation:fadeIn 0.3s;box-shadow:0 4px 16px rgba(0,0,0,0.2);';

        var colors = {
            success: '#27ae60', warning: '#f39c12', danger: '#e74c3c', info: '#3498db'
        };
        toast.style.background = colors[type] || colors.info;

        document.body.appendChild(toast);
        setTimeout(function() {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(function() { toast.remove(); }, 300);
        }, 3000);
    }

    // CSS animation追加
    var style = document.createElement('style');
    style.textContent = '@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}';
    document.head.appendChild(style);

})();
