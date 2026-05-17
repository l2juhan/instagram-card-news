# 리서치 — 구현 상세 추상화하기

## 출처
- Frontend Fundamentals (토스) — 코드 품질 > 가독성 > 맥락 줄이기 > 구현 상세 추상화하기
- URL: https://frontend-fundamentals.com/code-quality/code/examples/login-start-page.html
- 단일 권위 문서. 통계·수치 없음 → 별도 팩트체크 불필요. 코드 예시 원문 그대로 사용.

## 핵심 포인트
1. **원칙**: 한 사람이 코드를 읽을 때 동시에 고려할 수 있는 맥락의 수는 제한돼 있다. 구현 상세를 그대로 드러내면 그 한도를 넘어 역할 파악이 어렵다. → 더 작은 단위로 추상화하여 한 번에 볼 맥락을 제한한다. (가독성 = 맥락 줄이기)
2. **문제 상황(LoginStartPage)**: 로그인 상태를 확인하고 로그인되었으면 홈으로 이동시키는 로직(`useCheckLogin` + `onChecked` + `status` 분기)이 화면 컴포넌트에 그대로 노출됨.
3. **인지 부담**: `useCheckLogin`, `onChecked`, `status`, `"LOGGED_IN"` 등 여러 세부사항을 동시에 이해해야 함. 인증 체크 로직과 실제 로그인 화면 로직이 혼재되어 컴포넌트 역할 파악이 어려움.
4. **개선 방법(옵션 A — Wrapper)**: 인증 분기를 `AuthGuard` 래퍼 컴포넌트로 추출. 부모는 `<AuthGuard><LoginStartPage /></AuthGuard>` 형태로 감싸기만, `LoginStartPage`는 로그인 화면에만 집중.
5. **개선 방법(옵션 B — HOC)**: `withAuthGuard(LoginStartPage)` 고차 컴포넌트로 동일한 추상화 적용.
6. **효과**: 각 컴포넌트가 단일 관심사에 집중 → 한눈에 역할 파악. 한 번에 처리할 맥락이 6~7개 수준으로 제한. 함께 바뀔 코드의 응집도 증가, 의존성 단순화.
7. **일반화(글쓰기 비유)**: 글에서 "왼쪽으로 10걸음 걷기"라고 높은 수준으로 표현하듯, 코드도 구현 상세를 과도하게 드러내지 말고 더 작은 단위로 추상화하면 읽기 쉬워진다.

## 원문 코드 — Before (LoginStartPage)
function LoginStartPage() {
  useCheckLogin({
    onChecked: (status) => {
      if (status === "LOGGED_IN") {
        location.href = "/home";
      }
    }
  });

  /* ... 로그인 관련 로직 ... */

  return <>{/* ... 로그인 관련 컴포넌트 ... */}</>;
}

## 원문 코드 — After (옵션 A: AuthGuard Wrapper)
function App() {
  return (
    <AuthGuard>
      <LoginStartPage />
    </AuthGuard>
  );
}

function AuthGuard({ children }) {
  const status = useCheckLoginStatus();

  useEffect(() => {
    if (status === "LOGGED_IN") {
      location.href = "/home";
    }
  }, [status]);

  return status !== "LOGGED_IN" ? children : null;
}

function LoginStartPage() {
  /* ... 로그인 관련 로직 ... */
  return <>{/* ... 로그인 관련 컴포넌트 ... */}</>;
}

## 인용
- "한 사람이 코드를 읽을 때 동시에 고려할 수 있는 총 맥락의 숫자는 제한되어 있다." — Frontend Fundamentals
- "구현 상세를 지나치게 드러내면, 이 코드가 어떤 역할을 하는지 정확하게 파악하기 어렵다." — Frontend Fundamentals
