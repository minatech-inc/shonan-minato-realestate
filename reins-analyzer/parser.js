/**
 * REINS物件テキストパーサー
 * レインズからコピーしたテキストを構造化データに変換
 *
 * 対応パターン:
 * 1. 物件詳細ページのコピー（ラベル: 値 形式）
 * 2. 一覧のタブ区切りコピー
 * 3. 複数物件の連続貼り付け
 */

var ReinsParser = (function() {

    // レインズでよく使われるフィールドラベルの正規化マップ
    var FIELD_MAP = {
        // 物件名
        '物件名': '物件名', '物件名称': '物件名', '案件名': '物件名', '名称': '物件名',
        'マンション名': '物件名', 'ビル名': '物件名',
        // 所在地
        '所在地': '所在地', '住所': '所在地', '物件所在地': '所在地', '所在': '所在地',
        // 価格
        '価格': '価格(万円)', '売出価格': '価格(万円)', '販売価格': '価格(万円)',
        '取引価格': '価格(万円)', '成約価格': '価格(万円)', '希望価格': '価格(万円)',
        // 利回り
        '表面利回り': '表面利回り(%)', '利回り': '表面利回り(%)', '想定利回り': '表面利回り(%)',
        'グロス利回り': '表面利回り(%)', '満室想定利回り': '表面利回り(%)',
        // 駅距離
        '最寄駅': '駅徒歩(分)', '交通': '駅徒歩(分)', 'アクセス': '駅徒歩(分)',
        '最寄り駅': '駅徒歩(分)',
        // 構造
        '構造': '構造', '建物構造': '構造', '構造規模': '構造',
        // 面積
        '面積': '面積(㎡)', '建物面積': '建物面積(㎡)', '延床面積': '建物面積(㎡)',
        '専有面積': '面積(㎡)', '建物延床面積': '建物面積(㎡)',
        '土地面積': '土地面積(㎡)', '敷地面積': '土地面積(㎡)', '地積': '土地面積(㎡)',
        // 築年
        '築年月': '築年月', '築年': '築年月', '建築年月': '築年月', '建築年': '築年月',
        '竣工': '築年月', '竣工年月': '築年月',
        // 間取り
        '間取り': '間取り', '間取': '間取り',
        // 階数
        '階数': '階数', '階建': '階数', '階': '階数',
        // 管理費
        '管理費': '管理費', '管理費等': '管理費',
        // 総戸数
        '総戸数': '総戸数', '戸数': '総戸数', '総室数': '総戸数',
        // 現況
        '現況': '現況', '入居状況': '現況', '賃貸状況': '現況', '空室': '現況',
        // 用途地域
        '用途地域': '用途地域',
        // 建ぺい率
        '建ぺい率': '建ぺい率', '建蔽率': '建ぺい率',
        // 容積率
        '容積率': '容積率',
        // 接道
        '接道': '接道', '接道状況': '接道', '前面道路': '接道',
        // 都市計画
        '都市計画': '都市計画',
        // 権利
        '権利': '権利', '所有権': '権利', '権利形態': '権利',
        // 備考
        '備考': '備考', '特記事項': '備考', 'コメント': '備考',
        // 物件種別
        '物件種別': '物件種別', '種別': '物件種別', '物件種類': '物件種別',
        // 取引態様
        '取引態様': '取引態様',
    };

    /**
     * メインパース関数
     * @param {string} text - 貼り付けテキスト
     * @returns {Array} パース済み物件データの配列
     */
    function parse(text) {
        if (!text || !text.trim()) return [];

        // 前処理: 全角→半角数字、連続空白除去
        text = normalizeText(text);

        // 複数物件の分割を試みる
        var chunks = splitMultipleProperties(text);

        var results = [];
        for (var i = 0; i < chunks.length; i++) {
            var parsed = parseSingleProperty(chunks[i]);
            if (parsed && Object.keys(parsed).length >= 2) {
                results.push(parsed);
            }
        }

        return results;
    }

    /**
     * テキスト正規化
     */
    function normalizeText(text) {
        // 全角数字→半角
        text = text.replace(/[０-９]/g, function(c) {
            return String.fromCharCode(c.charCodeAt(0) - 0xFEE0);
        });
        // 全角ドット・コンマ
        text = text.replace(/．/g, '.').replace(/，/g, ',');
        // 連続空白をスペースに
        text = text.replace(/[　\t]+/g, ' ');
        return text;
    }

    /**
     * 複数物件テキストを分割
     */
    function splitMultipleProperties(text) {
        // 区切りパターン: 罫線、ページ境界、「物件番号」等
        var separators = [
            /[-=]{5,}/,              // -----, =====
            /物件番号\s*[:：]?\s*\d+/,
            /No\.\s*\d+/i,
            /【物件\d+】/,
            /^#{2,}\s/m,
        ];

        for (var i = 0; i < separators.length; i++) {
            var parts = text.split(separators[i]);
            if (parts.length > 1) {
                return parts.filter(function(p) { return p.trim().length > 20; });
            }
        }

        // タブ区切り一覧の場合（ヘッダー行 + データ行）
        var lines = text.trim().split('\n');
        if (lines.length >= 2 && lines[0].split('\t').length >= 3) {
            return parseTabDelimited(text);
        }

        return [text];
    }

    /**
     * タブ区切りテキストのパース
     */
    function parseTabDelimited(text) {
        var lines = text.trim().split('\n');
        if (lines.length < 2) return [text];

        var headers = lines[0].split('\t').map(function(h) { return h.trim(); });
        if (headers.length < 3) return [text];

        var results = [];
        for (var i = 1; i < lines.length; i++) {
            var values = lines[i].split('\t');
            if (values.length < 2) continue;
            var entry = '';
            for (var j = 0; j < headers.length && j < values.length; j++) {
                entry += headers[j] + ': ' + values[j].trim() + '\n';
            }
            results.push(entry);
        }
        return results.length > 0 ? results : [text];
    }

    /**
     * 単一物件テキストのパース
     */
    function parseSingleProperty(text) {
        var data = {};
        var lines = text.split('\n');

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line) continue;

            // パターン1: 「ラベル: 値」「ラベル　値」
            var match = line.match(/^([^:：\t]{1,20})\s*[:：\t]\s*(.+)$/);
            if (match) {
                assignField(data, match[1].trim(), match[2].trim());
                continue;
            }

            // パターン2: 価格検出（数字+万円）
            var priceMatch = line.match(/(\d[\d,]+)\s*万円/);
            if (priceMatch && !data['価格(万円)']) {
                data['価格(万円)'] = priceMatch[1].replace(/,/g, '');
            }

            // パターン3: 利回り検出（数字+%）
            var yieldMatch = line.match(/利回り\s*[:：]?\s*([\d.]+)\s*%?/);
            if (yieldMatch && !data['表面利回り(%)']) {
                data['表面利回り(%)'] = yieldMatch[1];
            }

            // パターン4: 駅距離検出
            var stationMatch = line.match(/(.*?駅)\s*[:：]?\s*徒歩?\s*(\d+)\s*分/);
            if (stationMatch && !data['駅徒歩(分)']) {
                data['駅徒歩(分)'] = stationMatch[1] + ' 徒歩' + stationMatch[2] + '分';
            }

            // パターン5: 住所検出
            var addrMatch = line.match(/((?:東京都|北海道|(?:京都|大阪)府|.{2,3}県).{2,}?(?:市|区|町|村|郡).+?)(?:\s|$)/);
            if (addrMatch && !data['所在地']) {
                data['所在地'] = addrMatch[1].trim();
            }

            // パターン6: 築年検出
            var yearMatch = line.match(/((?:昭和|平成|令和)\d+年\d*月?|\d{4}年\d*月?)\s*(?:築|建築|竣工)?/);
            if (yearMatch && !data['築年月']) {
                data['築年月'] = yearMatch[1];
            }
        }

        // 価格の追加正規化（億単位対応）
        if (!data['価格(万円)']) {
            var okuMatch = text.match(/(\d[\d.]*)億\s*(\d[\d,]*)?万?円?/);
            if (okuMatch) {
                var oku = parseFloat(okuMatch[1]) * 10000;
                var man = okuMatch[2] ? parseInt(okuMatch[2].replace(/,/g, '')) : 0;
                data['価格(万円)'] = String(oku + man);
            }
        }

        // 利回りの%除去
        if (data['表面利回り(%)']) {
            data['表面利回り(%)'] = data['表面利回り(%)'].replace(/%/g, '').trim();
        }

        // 価格のカンマ除去
        if (data['価格(万円)']) {
            data['価格(万円)'] = data['価格(万円)'].replace(/[,円万]/g, '').trim();
        }

        return data;
    }

    /**
     * フィールド名を正規化してデータに格納
     */
    function assignField(data, label, value) {
        if (!value || value === '-' || value === '−') return;

        // ラベル正規化
        var normalizedLabel = label;
        for (var key in FIELD_MAP) {
            if (label.indexOf(key) >= 0 || key.indexOf(label) >= 0) {
                normalizedLabel = FIELD_MAP[key];
                break;
            }
        }

        // 特殊処理: 価格フィールド
        if (normalizedLabel === '価格(万円)') {
            // 億対応
            var okuM = value.match(/(\d[\d.]*)億\s*(\d[\d,]*)?/);
            if (okuM) {
                var oku = parseFloat(okuM[1]) * 10000;
                var man = okuM[2] ? parseInt(okuM[2].replace(/,/g, '')) : 0;
                value = String(oku + man);
            } else {
                value = value.replace(/[,円万]/g, '').trim();
            }
        }

        // 特殊処理: 利回りフィールド
        if (normalizedLabel === '表面利回り(%)') {
            var yM = value.match(/([\d.]+)/);
            if (yM) value = yM[1];
        }

        // 駅徒歩: 分数だけ抽出できる場合
        if (normalizedLabel === '駅徒歩(分)') {
            // そのまま文字列で保持（スコアリング側で分数を抽出）
        }

        // 面積系: 単位記号を除去して数値のみ保持
        if (normalizedLabel === '面積(㎡)' || normalizedLabel === '建物面積(㎡)' || normalizedLabel === '土地面積(㎡)') {
            var aM = value.match(/([\d,]+(?:\.\d+)?)/);
            if (aM) value = aM[1].replace(/,/g, '');
        }

        if (!data[normalizedLabel]) {
            data[normalizedLabel] = value;
        }
    }

    // 公開API
    return {
        parse: parse,
        normalizeText: normalizeText
    };

})();
