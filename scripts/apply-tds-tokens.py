#!/usr/bin/env python3
"""toss 템플릿 14종에 실제 토스 디자인 시스템(TDS) 컬러 토큰을 주입/치환한다.

- 출처: TDS Foundation Colors (tossmini-docs.toss.im/tds-react-native/foundation/colors)
- 멱등(idempotent): --tds-bg 토큰이 이미 있으면 건너뛴다.
"""
import glob
import os
import re

TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "..", "templates", "toss")

# 실제 TDS 스케일 토큰 + 다크 테마 시맨틱 토큰
TOKEN_BLOCK = """
  /* === Toss Design System (TDS) 토큰 — 실제 토스 디자인 시스템 컬러 ===
     출처: TDS Foundation Colors. 다크 테마 카드뉴스용 시맨틱 매핑. */
  :root {
    --tds-grey-50:#F9FAFB; --tds-grey-400:#B0B8C1; --tds-grey-500:#8B95A1;
    --tds-grey-600:#6B7684; --tds-grey-700:#4E5968; --tds-grey-800:#333D4B;
    --tds-grey-900:#191F28;
    --tds-blue-400:#4593FC; --tds-blue-500:#3182F6; --tds-blue-600:#2272EB;
    --tds-red-300:#FB8890; --tds-red-400:#F66570; --tds-red-500:#F04452;
    --tds-green-300:#3FD599; --tds-green-400:#15C47E; --tds-green-500:#03B26C;
    /* 다크 테마 시맨틱 (grey900 base + greyOpacity 레이어링) */
    --tds-bg:var(--tds-grey-900);
    --tds-surface:#232A35;            /* TDS 다크 레이어드 표면 (grey900 + greyOpacityWhite) */
    --tds-text-strong:#FFFFFF;        /* 다크 테마 1차 텍스트 */
    --tds-text-weak:var(--tds-grey-500);
    --tds-text-subtle:var(--tds-grey-700);
    --tds-primary:var(--tds-blue-500);  /* Toss Blue */
  }
"""

# 리터럴 hex → TDS 토큰 변수 (대소문자 무시)
REPLACEMENTS = {
    r"#191F28": "var(--tds-bg)",
    r"#FFFFFF": "var(--tds-text-strong)",
    r"#8B95A1": "var(--tds-text-weak)",
    r"#4E5968": "var(--tds-text-subtle)",
    r"#B0B8C1": "var(--tds-grey-400)",
    r"#252B36": "var(--tds-surface)",
}

changed = []
for path in sorted(glob.glob(os.path.join(TEMPLATE_DIR, "*.html"))):
    with open(path, "r", encoding="utf-8") as f:
        html = f.read()

    if "--tds-bg" in html:
        print(f"skip (already tokenized): {os.path.basename(path)}")
        continue

    # 1) 먼저 본문의 리터럴 hex를 var()로 치환 (토큰 블록 주입 전 — 블록의 리터럴 hex 보존)
    new_html = html
    for hex_pat, var_ref in REPLACEMENTS.items():
        new_html = re.sub(hex_pat, var_ref, new_html, flags=re.IGNORECASE)

    # 2) 그 다음 첫 <style> 직후에 리터럴 hex 값을 가진 토큰 블록 주입
    new_html, n = re.subn(r"(<style>)", r"\1" + TOKEN_BLOCK, new_html, count=1)
    if n == 0:
        print(f"WARN no <style> in {os.path.basename(path)} — skipped")
        continue

    with open(path, "w", encoding="utf-8") as f:
        f.write(new_html)
    changed.append(os.path.basename(path))

print(f"\nupdated {len(changed)} templates: {', '.join(changed)}")
