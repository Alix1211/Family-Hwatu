# Family Hwatu — 개인용 오프라인 버전

원본 맞고·고스톱 게임 규칙과 AI 코드는 그대로 쓰고, 게임 서버·로그인·MySQL 대신 기기 안에 데이터를 저장하는 실험 버전입니다.

## 실행·빌드

```bash
npm install
npm run dev:offline
```

개발용 주소는 `http://127.0.0.1:5234`입니다. 서버(.NET), MySQL은 필요하지 않습니다.

배포용 정적 파일은 다음 명령으로 생성됩니다.

```bash
npm run build:offline
```

결과물: `dist-offline/`. 정적 파일 호스팅에 이 폴더의 파일들을 배포하면 됩니다. **백엔드 서버는 필요 없습니다.**

## 오프라인 플레이 방식

- 스마트폰·태블릿에서 최초 1회 HTTPS 주소로 접속해 PWA를 설치합니다.
- 앱과 게임 카드·음악 등의 정적 파일을 모두 캐시하면 이후 통신이 끊겨도 게임을 즐길 수 있습니다.
- 게임머니·전적은 브라우저의 localStorage, 맞고 진행 상태는 기존 IndexedDB에 보관합니다.
- 기기의 사이트 데이터나 브라우저 저장 공간을 삭제하면 세이브도 사라집니다. **기기 간 자동 동기화는 지원하지 않습니다.**
- `file://`로 `index.html`을 직접 열어 실행하는 방식은 브라우저 보안 제약으로 지원하지 않습니다. 서버 프로그램이 없는 **정적 웹앱/PWA** 방식입니다.

## 원본 보존

- 일반 `npm run dev` 및 `npm run build` 명령은 원래 서버 연동 버전대로 동작합니다.
- 오프라인 버전에서는 계정 관리 화면이 숨겨지고 로컬 플레이어가 자동으로 선택됩니다.
- 원본 카드 그림, 오디오, 맞고·고스톱 점수 규칙과 AI 난이도 코드는 변경하지 않았습니다.

## 2026-10-26 꽃무늬 게임판 적용

- 2인 맞고: `apps/web/public/floral/matgo-pink.png` (벚꽃 핑크판).
- 3인 고스톱: `apps/web/public/floral/gostop-mint.png` (민트 꽃판).
- `flower-plates.png`와 `flower-icons.png`는 제공된 가이드에서 게임방 점수판, 획득패 영역, 난이도, 버튼, 일부 캐릭터 아이콘에 사용합니다.
- 게임판 스타일은 `apps/web/src/styles/flowerTheme.css`에서 따로 관리합니다. **게임 카드 앞면은 수정하지 않았습니다.**
- 2026-10-26에 사용자가 다시 보내주신 `gaia_flower_plates_and_controls (1) 복사.png`로 플레이트 아틀라스를 교체했습니다. **새 파일은 실제 투명 PNG**이며, 오래된 불투명 시트는 더 이상 참조하지 않습니다.
- 기존 로비 참고 시안과 스프라이트 시트는 `design-references/family-hwatu/`에 보관합니다. 후속 작업에서 로비·맞고/고스톱 판돈 선택 화면에 꽃 UI 스킨을 적용했습니다. `apps/web/src/styles/familyMenuTheme.css`와 `apps/web/public/floral/menu/`의 투명 WebP 15개가 그 적용 파일입니다. 텍스트·금액·입장 동작은 기존 React 컴포넌트를 사용합니다.
- `uniqueId.ts`는 HTTP/오프라인 환경에서 `crypto.randomUUID()`가 없을 때 게임이 빈 화면이 되지 않도록 UUID를 생성합니다.
- 개인용 정적 실행본은 `dist-offline/`에 있으며, `file://`로 직접 열지 말고 HTTPS 정적 호스팅 또는 APK WebView 패키징으로 실행하십시오.

## 검증

이전 `a6bc17e` 작업에서 46개 스위트, 291개 테스트 및 `build:offline` 빌드를 통과했습니다. 이후 메뉴 CSS/WebP 적용은 새 빌드/태블릿 실기기 확인이 남아 있습니다. 코드가 GitHub 브랜치에 올라간 것만으로 기존 배포 사이트나 APK가 바뀌는 것은 아닙니다.

`npm run typecheck`, `npm test`, `npm run build:offline`을 실행해 코드·빌드 검사를 진행합니다. 실제 기기에서 최초 설치, 비행기 모드 재실행, 게임머니 정산과 이어하기는 별도 확인이 필요합니다.
