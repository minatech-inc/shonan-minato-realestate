# SEO セットアップ手順書（あなた側の作業）

両サイト（realestate.minatech1210.com / realty.minatech1210.com）の検索エンジン登録・解析タグ有効化を行う手順。**所要時間：合計30〜60分**。

---

## 全体の流れ

```
1. Google Search Console 登録 + サイトマップ提出
2. Bing Webmaster Tools 登録
3. Google ビジネスプロフィール（不動産業者として）
4. Google Analytics 4（GA4）作成 + 計測ID取得
5. Microsoft Clarity（ヒートマップ・無料）作成 + ID取得
6. 取得した認証コード・IDをHTML/analytics.jsに反映
7. デプロイ → 動作確認
```

---

## 1. Google Search Console 登録（最重要・10分）

### 1.1 プロパティ追加
1. https://search.google.com/search-console にアクセス
2. プロパティタイプ「URL プレフィックス」を選択
3. URLを入力：`https://realestate.minatech1210.com/`
4. 「続行」

### 1.2 所有権の確認（HTMLタグ方式）
1. 認証方法で「HTML タグ」を選択
2. 表示される `<meta name="google-site-verification" content="ABCDEF..." />` の `content` 値（例: `xK9...`）を**コピー**
3. ファイル `website/index.html` 〜 `area/*.html` 〜 `blog/*.html` の以下を全て置換：
   ```
   GOOGLE_SITE_VERIFICATION_PLACEHOLDER  →  あなたの認証コード
   ```
   ※全HTMLファイル（index, about, sell, contact, market, faq, blog/*, area/*）にこのプレースホルダーが入っています
4. コミット&プッシュ → デプロイ反映
5. Search Console に戻り「確認」をクリック → 緑チェックで完了

### 1.3 サイトマップ提出
1. Search Console 左メニュー「サイトマップ」
2. 「新しいサイトマップの追加」に `sitemap.xml` を入力 → 送信
3. 成功すると「成功しました」表示

### 1.4 realty.minatech1210.com も同じ手順で
- プロパティ追加 `https://realty.minatech1210.com/`
- 同じ認証コードを `realty/index.html` `landing.html` の `GOOGLE_SITE_VERIFICATION_PLACEHOLDER` に置換
- ※ realty サブドメインは別プロパティとして登録が必要
- サイトマップ：`sitemap.xml`

---

## 2. Bing Webmaster Tools 登録（5分）

1. https://www.bing.com/webmasters/ にアクセス
2. 「サインイン」→ Microsoft アカウントでログイン
3. 「Google Search Console からインポート」を選択（楽）
   - または手動：「URL を追加」→ `https://realestate.minatech1210.com/`
4. 認証方式「メタタグ」→ 表示される `<meta name="msvalidate.01" content="..." />` の値を**コピー**
5. 全HTMLの `BING_SITE_VERIFICATION_PLACEHOLDER` を上記コードに置換
6. realty.minatech1210.com も同様

---

## 3. Google ビジネスプロフィール（旧マイビジネス・15分）

**ローカルSEOで超重要**。「藤沢 不動産」のローカル検索結果や Google マップに表示されるようになります。

1. https://www.google.com/business/ にアクセス
2. 「今すぐ管理」→ Googleアカウントでログイン
3. ビジネス名を検索 → 既存登録があれば請求、なければ新規作成
4. 入力内容：
   - **ビジネス名**: MinaTech株式会社（Shonan Minato REAL ESTATE）
   - **カテゴリ**: 不動産仲介業（メイン）+ 不動産業（サブ）
   - **所在地**: 〒251-0055 神奈川県藤沢市南藤沢3-12 クリオ藤沢駅前 7階
   - **サービス提供地域**: 藤沢市・茅ヶ崎市・鎌倉市・葉山町・横浜市
   - **電話**: 0467-28-7603
   - **ウェブサイト**: https://realestate.minatech1210.com/
   - **営業時間**: 年中無休 10:00〜21:00
5. 認証：所在地宛にハガキで認証コードが届く（5〜14日）
6. 認証後、写真追加・サービス追加で完成度UP

---

## 4. Google Analytics 4（GA4）作成（10分）

1. https://analytics.google.com にアクセス
2. 「測定を開始」→ アカウント作成
   - アカウント名: MinaTech
   - プロパティ名: Shonan Minato REAL ESTATE
   - タイムゾーン: 日本
   - 通貨: 日本円
3. データストリーム作成
   - ウェブ
   - URL: `https://realestate.minatech1210.com/`
   - ストリーム名: Shonan Minato REAL ESTATE
4. **測定ID（G-XXXXXXXXXX）をコピー**
5. ファイル `website/analytics.js` の `GA4_MEASUREMENT_ID` を上記IDに置換：
   ```js
   GA4_MEASUREMENT_ID: 'G-XXXXXXXXXX',  // ← ここに実際のIDを入力
   ```
6. realty 側も同じ手順で別ストリームを作るか、共通ストリームで両サイトをカバー
   - 推奨：1つのプロパティで両サイト（クロスドメイントラッキング設定が必要）

---

## 5. Microsoft Clarity（ヒートマップ・5分）

完全無料・登録だけで使える神ツール。**ユーザーがどこをクリックして離脱したかが見える**。

1. https://clarity.microsoft.com にアクセス
2. 「Sign in to Clarity」→ Microsoftアカウント/Googleアカウント
3. 「New project」
   - Name: Shonan Minato REAL ESTATE
   - Website URL: `https://realestate.minatech1210.com/`
4. Settings → Setup → **Project ID（10桁程度）をコピー**
5. ファイル `website/analytics.js` の `CLARITY_PROJECT_ID` を上記IDに置換

---

## 6. 反映確認

すべての置換後：
1. `git add -A && git commit -m "SEO: 認証コード反映"`
2. `git push origin main`
3. デプロイ完了（GitHub Pages 1〜3分）後、各管理ツールで「確認」をクリック
4. Google Analytics の「リアルタイム」レポートで自分のアクセスが見えれば成功

---

## 期待効果と時間軸

| 期間 | 期待効果 |
|---|---|
| 1〜3日 | Search Console / Bing にインデックス開始（数ページずつ） |
| 1〜2週間 | 主要ページがインデックス完了 |
| 2〜4週間 | ロングテールキーワードで検索流入開始 |
| 1〜3ヶ月 | 「藤沢 不動産」等の主要キーワードで2〜3ページ目に表示 |
| 3〜6ヶ月 | ブログ・エリアページが資産化、1ページ目を狙える |
| 6ヶ月〜 | 月数百〜数千の自然流入が安定 |

**重要**: SEOは時間がかかります。**今すぐ始めることが最大の節約**です。

---

## 緊急時のチェックリスト

- [ ] Google Search Console に realestate + realty 両方登録済み？
- [ ] サイトマップ送信済み？「成功しました」表示？
- [ ] 認証メタタグが本番HTMLに反映されている？（F12で確認）
- [ ] GA4 リアルタイムで自分のアクセスが見える？
- [ ] Google ビジネスプロフィールのハガキ認証完了？
- [ ] Bing Webmaster でも所有権確認済み？

すべて ✓ ならSEO基盤は整いました。あとは **ブログ更新（月1〜2本）と、Google ビジネスプロフィールの口コミ獲得** が継続施策です。

---

## 困ったときの問い合わせ先

- Search Console ヘルプ: https://support.google.com/webmasters
- GA4 ヘルプ: https://support.google.com/analytics
- Clarity ヘルプ: https://docs.microsoft.com/clarity
- ビジネスプロフィール: https://support.google.com/business
