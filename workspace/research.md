# MCP(Model Context Protocol)란 무엇인가? — 리서치 보고서

> 작성일: 2026-03-23 | 주제: MCP가 뭘까?

---

## 1. 핵심 정의

**MCP(Model Context Protocol)**는 2024년 11월 Anthropic이 공개한 오픈소스 표준 프로토콜로, AI 모델과 외부 데이터 소스·도구를 표준화된 방식으로 연결한다.

- **한 줄 정의**: AI 어플리케이션을 위한 USB-C 포트 — 어떤 AI 모델이든, 어떤 외부 도구든 표준 방식으로 연결
- **공식 정의**: "LLM 애플리케이션과 외부 데이터 소스 및 도구 간의 원활한 통합을 가능하게 하는 오픈 프로토콜"
- **제작사**: Anthropic (현재는 Linux Foundation 산하 Agentic AI Foundation에 기증)

---

## 2. 왜 필요한가? (기존 문제점)

### Before MCP: 파편화된 통합 지옥
- AI 모델마다 데이터 소스 연결 방식이 달랐음 → OpenAI function calling, Google 방식, 자체 구현…
- 새로운 데이터 소스가 추가될 때마다 **맞춤형 코드** 필요 (N×M 문제)
- AI 모델이 데이터 사일로(Data Silo)와 레거시 시스템에 고립
- 하나의 AI 연동을 다른 모델에 재사용 불가 → 벤더 종속(Vendor Lock-in)

### After MCP: 하나의 표준으로 모든 연결
- MCP 서버를 한 번 만들면 → 모든 MCP 호환 AI 클라이언트에서 재사용 가능
- AI 모델을 바꿔도 기존 도구 연동 코드 유지
- 보안 권한 모델을 프로토콜 레벨에서 표준화

---

## 3. 작동 원리 (클라이언트-서버 아키텍처)

MCP는 **3계층 구조**로 작동한다:

```
[사용자] ↔ [Host(LLM 앱)] ↔ [MCP Client] ↔ [MCP Server] ↔ [외부 데이터/도구]
```

### 구성 요소

| 구성 요소 | 역할 | 예시 |
|---|---|---|
| **Host** | LLM을 품고 있는 애플리케이션 | Claude Desktop, Cursor, VS Code |
| **MCP Client** | Host 내부에서 서버와 통신하는 모듈 | 요청 번역·전달 담당 |
| **MCP Server** | 외부 도구·데이터를 MCP 규격으로 노출 | GitHub 서버, Slack 서버, DB 서버 |

### 연결 방식 (Transport)
- **stdio** (Standard I/O): 로컬 도구 연동에 최적, 단순 입출력
- **Streamable HTTP**: 원격 서버 연동, 단일 엔드포인트(`/mcp`) 기반 (2025-03-26 스펙에서 SSE 대체)

### 연결 순서
1. MCP 클라이언트 시작 → 설정된 MCP 서버들에 연결
2. 클라이언트가 각 서버에 "어떤 기능을 제공하나요?" 질의
3. 서버가 사용 가능한 Tools / Resources / Prompts 목록 응답
4. LLM이 대화 중 필요 시 서버 기능 호출

---

## 4. MCP가 제공하는 3대 기능

### Tools (도구)
- LLM이 **실행 가능한 액션** — API 호출, 코드 실행, 파일 조작 등
- 예: "GitHub에 PR 생성", "Slack 메시지 전송", "DB 쿼리 실행"
- LLM이 판단해서 자율적으로 호출

### Resources (리소스)
- LLM에게 제공하는 **읽기 전용 데이터** — 파일, DB 레코드, API 응답 등
- 사이드 이펙트 없음 (읽기 전용)
- 예: "현재 프로젝트 파일 목록", "사용자 정보 조회"

### Prompts (프롬프트 템플릿)
- 서버가 정의한 **재사용 가능한 프롬프트 워크플로우**
- 팀이나 조직 전체에서 표준화된 AI 상호작용 정의
- 예: "코드 리뷰 요청 템플릿", "버그 리포트 생성 템플릿"

### Sampling (고급 기능)
- MCP 서버가 **클라이언트의 LLM에게 역으로 추론 요청** 가능
- 에이전트 워크플로우에서 서버 측 AI 추론 오프로딩
- 직접 LLM API 비용 없이 모델 생성 결과 활용 가능

---

## 5. MCP vs Function Calling 비교

| 항목 | Function Calling | MCP |
|---|---|---|
| **범위** | 단일 모델·앱 내부 | 크로스 모델·크로스 플랫폼 |
| **재사용성** | 낮음 (앱마다 재구현) | 높음 (서버 한 번 구축 → 전 클라이언트 사용) |
| **벤더 종속** | 있음 (OpenAI vs Google 등 달라짐) | 없음 (표준 프로토콜) |
| **복잡도** | 낮음 (프로토타입에 적합) | 높음 (엔터프라이즈 확장에 적합) |
| **사용 시점** | 소규모 단순 프로젝트 | 복잡한 멀티 툴 에이전트 시스템 |

> 결론: 경쟁이 아닌 상호보완 — Function Calling은 "지금 웹 검색해줘", MCP는 "웹 검색 기능을 어디서나 재사용 가능하게 노출하는 생태계 인프라"

---

## 6. 실제 활용 사례

### 개발 도구 연동
- **GitHub MCP 서버**: PR 생성·리뷰, 이슈 관리, 코드 검색 — Claude가 직접 GitHub 조작
- **Cursor / VS Code**: AI 코딩 어시스턴트가 파일 시스템·터미널에 실시간 접근

### 기업 데이터 연동
- **Block (Square)**: 결제 데이터, 비즈니스 인텔리전스 분석에 MCP 연동
- **Bloomberg**: 금융 데이터 분석, 뉴스 요약 파이프라인
- **Amazon**: AWS 서비스 오케스트레이션, DevOps 자동화

### SaaS 통합
- **Slack, Google Drive, Notion, PostgreSQL, Git** 등 공식 서버 제공
- 회의록 자동 요약 + Slack 전송, 코드 리뷰 + Jira 티켓 생성 등 멀티 앱 워크플로우

### AI 에이전트
- 여러 MCP 서버를 동시에 연결한 **자율 에이전트**가 복합 작업 수행
- 예: "다음 주 마케팅 보고서 작성 → DB 조회 + 슬라이드 생성 + 이메일 발송" 자동화

---

## 7. 관련 통계 및 수치

| 지표 | 수치 | 출처 |
|---|---|---|
| 월간 SDK 다운로드 | **9,700만 회** (Python + TypeScript) | Pento MCP 1년 리뷰 (2025) |
| MCP 서버 수 (커뮤니티 집계) | **10,000개 이상** (Glama 14,274개, PulseMCP 7,600개+) | 커뮤니티 디렉터리 집계 |
| 공식 발표 | 2024년 11월 | Anthropic 공식 블로그 |
| Linux Foundation 기증 | 2025년 12월 | Agentic AI Foundation 설립 |
| 채택 AI 플랫폼 | Claude, ChatGPT, Gemini, Copilot, Cursor, VS Code | 각사 공식 발표 |
| Gartner 예측 | 2026년까지 API 게이트웨이 벤더의 **75%**가 MCP 기능 탑재 (2차 인용) | Gartner 2025 보고서 기반 |
| Gartner 에이전트 예측 | 2026년까지 엔터프라이즈 앱의 **40%**에 태스크 특화 AI 에이전트 탑재 | Gartner |

---

## 8. 전문가 의견 / 인용구

> **"MCP 같은 오픈 기술은 AI를 실제 애플리케이션과 연결하는 다리로, 혁신이 접근 가능하고 투명하며 협업에 뿌리를 두도록 보장합니다."**
> — **Dhanji R. Prasanna**, Block(Square) CTO (원문: "Open technologies like the Model Context Protocol are the bridges that connect AI to real-world applications, ensuring innovation is accessible, transparent, and rooted in collaboration.")

---

> **"AI 클라이언트와 서버 양 끝에 LLM을 두고 주고받을 것을 협상하게 만들 수 있다. 이것은 소프트웨어 개발을 혁명적으로 바꿀 것이다 — 그리고 매우 흥미롭다."**
> — 업계 분석가, The New Stack 인터뷰 (2025)

---

## 9. MCP 보안 모델과 주의사항

### 보안 체계 (2025-03-26 스펙 기준)
- 원격 MCP 서버는 **OAuth 2.1 + PKCE** 구현 의무
- MCP 서버는 OAuth Resource Server로 분류, Authorization Server 메타데이터 제공
- RFC 8707 Resource Indicators 구현 필수 → 토큰 오용 방지
- 공식 스펙: "항상 인간이 도구 호출을 거부할 수 있어야 함 (human-in-the-loop)"

### 보안 위협 사례
- **프롬프트 인젝션**: 악성 MCP 서버가 AI에게 숨겨진 명령 주입 (OWASP LLM 위협 1위)
- **툴 포이즈닝**: 설치 시엔 안전해 보이는 서버가 나중에 동작 변경 (예: API 키 탈취)
- 실제 CVE: `mcp-remote` OS 커맨드 인젝션(CVE-2025-6514), WhatsApp 채팅 기록 탈취 시연 등

---

## 10. MCP의 미래 전망

### 2026년 MCP 로드맵 (공식 블로그 발표)
- **거버넌스 강화**: Linux Foundation 이관 후 Working Group + SEP(Spec Enhancement Proposals) 체계 운영
- **프로덕션 안정성**: 비동기 작업, 상태 관리, 공식 레지스트리 고도화
- **엔터프라이즈 전환기**: 2025년 실험 단계 → 2026년 전사 도입 본격화

### 시장 전망
- 2026년 = "MCP 엔터프라이즈 원년" — 실험에서 전사 표준으로
- 벤더 중립(Linux Foundation) + 빅테크 연대(Anthropic + OpenAI + Google + Microsoft)로 사실상 업계 표준 확정

### 핵심 전망 포인트
1. **AI 앱의 USB-C 표준화** 완성 — 모든 AI 툴이 MCP 지원
2. **멀티 에이전트 오케스트레이션** 가속 — A2A(Agent-to-Agent) 프로토콜과 협력
3. **보안·권한 관리** 표준화 — 엔터프라이즈급 인증·인가 레이어 추가
4. **로컬 vs 클라우드 MCP** 구분 심화 — 온프레미스 데이터 보호를 위한 로컬 MCP 서버 수요 증가

---

## 참고 출처
- [Anthropic — Introducing the Model Context Protocol](https://www.anthropic.com/news/model-context-protocol)
- [Anthropic — Donating MCP to Agentic AI Foundation](https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation)
- [Model Context Protocol 공식 사이트](https://modelcontextprotocol.io/)
- [Pento — A Year of MCP: From Internal Experiment to Industry Standard](https://www.pento.ai/blog/a-year-of-mcp-2025-review)
- [The New Stack — Why the Model Context Protocol Won](https://thenewstack.io/why-the-model-context-protocol-won/)
- [CData — 2026: The Year for Enterprise-Ready MCP Adoption](https://www.cdata.com/blog/2026-year-enterprise-ready-mcp-adoption)
- [WorkOS — Understanding MCP features: Tools, Resources, Prompts, Sampling](https://workos.com/blog/mcp-features-guide)
- [Descope — MCP vs. Function Calling](https://www.descope.com/blog/post/mcp-vs-function-calling)
- [Wikipedia — Model Context Protocol](https://en.wikipedia.org/wiki/Model_Context_Protocol)
- [Guptadeepak — MCP Enterprise Adoption Guide 2025](https://guptadeepak.com/the-complete-guide-to-model-context-protocol-mcp-enterprise-adoption-market-trends-and-implementation-strategies/)
