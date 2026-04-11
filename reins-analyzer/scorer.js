/**
 * REINS物件スコアリングエンジン
 * realestate_scraper.py の evaluate() と同一ロジックをJSに移植
 *
 * 10点満点評価:
 *   エリア市場性: 0-3点（tier1/2/3）
 *   表面利回り:   0-2点（15%以上=2, 10%以上=1）
 *   駅距離:       0-1点（10分以内=1）
 *   価格帯:       0-1点（500万以下=1）
 *   賃貸中(OC):   0-1点
 *   構造・築年:   0-1点
 *   再建築不可:   -3点
 *   実質利回り:   0 or -2点（実質5%未満=-2）
 *
 * 判定: 7+→S即日 / 5-6→A今週 / 3-4→B今月 / 2以下→C見送り
 */

var ReinsScorer = (function() {

    // エリアティア定義（realestate_scraper.py と同一）
    var TIER1 = ['埼玉', '千葉', '神奈川', '大阪', '愛知', '福岡'];
    var TIER2 = ['茨城', '栃木', '群馬', '静岡', '兵庫', '京都', '広島', '宮城', '北海道'];
    var TIER3 = ['新潟', '長野', '岡山', '熊本', '鹿児島', '和歌山', '三重', '滋賀'];
    var LOW_DEMAND = ['宮古市', '釜石市', '大船渡市', '夕張市', '歌志内', '三笠市', '五島', '対馬', '壱岐'];

    // 東京23区（特別加点）
    var TOKYO_23KU = [
        '千代田区', '中央区', '港区', '新宿区', '文京区', '台東区', '墨田区', '江東区',
        '品川区', '目黒区', '大田区', '世田谷区', '渋谷区', '中野区', '杉並区', '豊島区',
        '北区', '荒川区', '板橋区', '練馬区', '足立区', '葛飾区', '江戸川区'
    ];

    /**
     * エリアティア判定
     */
    function getAreaTier(location) {
        if (!location) return { tier: 0, reason: '所在地不明' };

        // 低需要エリアチェック
        for (var i = 0; i < LOW_DEMAND.length; i++) {
            if (location.indexOf(LOW_DEMAND[i]) >= 0) {
                return { tier: 0, reason: '低需要(' + LOW_DEMAND[i] + ')' };
            }
        }

        // 東京23区は最高ティア
        for (var i = 0; i < TOKYO_23KU.length; i++) {
            if (location.indexOf(TOKYO_23KU[i]) >= 0) {
                return { tier: 1, reason: '主力(東京' + TOKYO_23KU[i] + ')' };
            }
        }

        // 東京都（23区以外）
        if (location.indexOf('東京') >= 0) {
            return { tier: 2, reason: '準主力(東京都下)' };
        }

        // TIER1
        for (var i = 0; i < TIER1.length; i++) {
            if (location.indexOf(TIER1[i]) >= 0) {
                return { tier: 1, reason: '主力(' + TIER1[i] + ')' };
            }
        }
        // TIER2
        for (var i = 0; i < TIER2.length; i++) {
            if (location.indexOf(TIER2[i]) >= 0) {
                return { tier: 2, reason: '準主力(' + TIER2[i] + ')' };
            }
        }
        // TIER3
        for (var i = 0; i < TIER3.length; i++) {
            if (location.indexOf(TIER3[i]) >= 0) {
                return { tier: 3, reason: '条件付き(' + TIER3[i] + ')' };
            }
        }

        return { tier: 0, reason: '対象外' };
    }

    /**
     * 駅距離（分）を抽出
     */
    function extractStationMinutes(text) {
        if (!text) return 99;
        var m = text.match(/(\d+)\s*分/);
        return m ? parseInt(m[1]) : 99;
    }

    /**
     * 築年数を計算
     */
    function calcBuildingAge(builtStr) {
        if (!builtStr) return null;

        var year = null;

        // 西暦
        var westernMatch = builtStr.match(/(\d{4})\s*年/);
        if (westernMatch) {
            year = parseInt(westernMatch[1]);
        }

        // 和暦
        if (!year) {
            var eraMatch = builtStr.match(/(昭和|平成|令和)\s*(\d+)\s*年/);
            if (eraMatch) {
                var era = eraMatch[1];
                var eraYear = parseInt(eraMatch[2]);
                if (era === '昭和') year = 1925 + eraYear;
                else if (era === '平成') year = 1988 + eraYear;
                else if (era === '令和') year = 2018 + eraYear;
            }
        }

        if (!year) return null;
        return new Date().getFullYear() - year;
    }

    /**
     * メインスコアリング関数
     * @param {Object} prop - パース済み物件データ
     * @returns {Object} スコアリング結果
     */
    function evaluate(prop) {
        var price = parseFloat(prop['価格(万円)']) || 9999;
        var yld = parseFloat(prop['表面利回り(%)']) || 0;
        var station = extractStationMinutes(prop['駅徒歩(分)']);
        var location = prop['所在地'] || '';
        var structure = prop['構造'] || '';
        var built = prop['築年月'] || '';
        var situation = prop['現況'] || '';
        var fullText = JSON.stringify(prop);

        var areaTier = getAreaTier(location);

        if (areaTier.tier === 0 && areaTier.reason !== '所在地不明') {
            return {
                score: 0,
                rank: 'C',
                priority: 'C(対象外)',
                risk: '高',
                reasons: [areaTier.reason],
                areaReason: areaTier.reason
            };
        }

        var score = 0;
        var reasons = [];

        // === エリア (0-3) ===
        if (areaTier.tier === 1) {
            score += 3;
            reasons.push('主力エリア');
        } else if (areaTier.tier === 2) {
            score += 2;
            reasons.push('準主力エリア');
        } else if (areaTier.tier === 3) {
            if (yld >= 15 && station <= 10) {
                score += 1;
                reasons.push('条件付きOK');
            }
        }

        // === 利回り (0-2) ===
        if (yld >= 15) {
            score += 2;
            reasons.push('利回り' + yld + '%');
        } else if (yld >= 10) {
            score += 1;
            reasons.push('利回り' + yld + '%');
        } else if (yld > 0) {
            reasons.push('利回り' + yld + '%(低)');
        }

        // === 駅距離 (0-1) ===
        if (station <= 10) {
            score += 1;
            reasons.push('駅' + station + '分');
        } else if (station < 99) {
            reasons.push('駅' + station + '分(遠)');
        }

        // === 価格帯 (0-1) ===
        if (price <= 500) {
            score += 1;
            reasons.push(price + '万(低価格帯)');
        }

        // === 賃貸中 (0-1) ===
        if (situation.indexOf('賃貸中') >= 0 || situation.indexOf('満室') >= 0 ||
            fullText.indexOf('賃貸中') >= 0 || fullText.indexOf('オーナーチェンジ') >= 0) {
            score += 1;
            reasons.push('賃貸中(OC)');
        }

        // === 構造・築年 (0-1, -3) ===
        var age = calcBuildingAge(built);
        var isRC = structure.indexOf('RC') >= 0 || structure.indexOf('鉄筋') >= 0 ||
                   structure.indexOf('SRC') >= 0;
        var isSteel = structure.indexOf('鉄骨') >= 0 || structure.indexOf('S造') >= 0;

        if (isRC && age !== null && age <= 30) {
            score += 1;
            reasons.push('RC築' + age + '年');
        } else if (isSteel && age !== null && age <= 20) {
            score += 1;
            reasons.push('鉄骨築' + age + '年');
        } else if (age !== null) {
            reasons.push('築' + age + '年');
        }

        // === 再建築不可チェック ===
        if (fullText.indexOf('再建築不可') >= 0 || fullText.indexOf('建築不可') >= 0) {
            score -= 3;
            reasons.push('再建築不可(-3)');
        }

        // === 実質利回りチェック ===
        if (yld > 0 && price > 0) {
            var netYield = yld * 0.75; // 概算: 表面の75%
            if (netYield < 5) {
                score -= 2;
                reasons.push('実質' + netYield.toFixed(1) + '%(要注意)');
            }
            prop['実質利回り概算(%)'] = netYield.toFixed(1);
        }

        // スコアは0以下にしない
        if (score < 0) score = 0;

        // ランク判定
        var rank, priority, risk;
        if (score >= 7) {
            rank = 'S'; priority = 'S(即日)'; risk = '低';
        } else if (score >= 5) {
            rank = 'A'; priority = 'A(今週)'; risk = '中低';
        } else if (score >= 3) {
            rank = 'B'; priority = 'B(今月)'; risk = '中';
        } else {
            rank = 'C'; priority = 'C(見送り)'; risk = '高';
        }

        return {
            score: score,
            rank: rank,
            priority: priority,
            risk: risk,
            reasons: reasons,
            areaReason: areaTier.reason,
            netYield: prop['実質利回り概算(%)'] || null,
            buildingAge: age
        };
    }

    /**
     * 物件配列を一括スコアリング
     * @param {Array} properties
     * @returns {Array} スコア付き物件配列（スコア降順）
     */
    function evaluateAll(properties) {
        var results = [];

        for (var i = 0; i < properties.length; i++) {
            var prop = properties[i];
            var result = evaluate(prop);

            // スコアリング結果を物件データにマージ
            prop['スコア'] = result.score;
            prop['評価ランク'] = result.rank;
            prop['優先度'] = result.priority;
            prop['リスク評価'] = result.risk;
            prop['エリア評価'] = result.areaReason;
            prop['判断根拠'] = result.reasons.join(' / ');
            if (result.netYield) prop['実質利回り概算(%)'] = result.netYield;
            if (result.buildingAge !== null) prop['築年数'] = result.buildingAge;

            results.push(prop);
        }

        // スコア降順ソート
        results.sort(function(a, b) {
            return (b['スコア'] || 0) - (a['スコア'] || 0);
        });

        return results;
    }

    return {
        evaluate: evaluate,
        evaluateAll: evaluateAll,
        getAreaTier: getAreaTier,
        calcBuildingAge: calcBuildingAge
    };

})();
