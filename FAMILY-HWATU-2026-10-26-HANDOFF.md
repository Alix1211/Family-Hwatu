# 가족화투 오프라인 게임 — 작업 인수인계 (2026-10-26)

## 1. 어디서 이어서 작업할지

- 개인 저장소: `https://github.com/Alix1211/Family-Hwatu` (비공개)
- **기준 브랜치: `offline-ai-prototype`** — 이 브랜치에서 이어서 작업한다.
- 원본: `itsent-lab/hwatu`. 원본 서버 연동 구조와 개인용 오프라인 빌드를 혼동하지 않는다.
- 게임 종류: 2인 **맞고** + 3인 **고스톱**, 모두 컴퓨터 상대. React/Vite UI.
- 사용자는 디자이너이며, 게임 규칙이나 레이아웃을 임의로 재기획하지 말 것. 수정 전 기존 동작을 유지한다.

## 2. 이번까지 완료된 사항

### 오프라인 모드

- `.NET` 서버, MySQL, 로그인 없이 기기 안에서 AI 대전 가능.
- `npm run dev:offline` 개발 실행 및 `npm run build:offline` 정적 PWA 빌드.
- 저장: 게임머니/전적은 브라우저 로컬 저장소, 맞고 이어하기는 기존 IndexedDB.
- 오프라인용 서비스 워커가 빌드 결과물의 정적 파일들을 캐시한다.
- 보안이 제한된 HTTP 환경에서 `crypto.randomUUID()` 부재로 게임 시작 시 빈 화면이 되던 오류를 `apps/web/src/lib/uniqueId.ts` 대체 함수로 해결했다.

### 게임판 UI

- 2인 맞고: `apps/web/public/floral/matgo-pink.png` 핑크 벚꽃 배경.
- 3인 고스톱: `apps/web/public/floral/gostop-mint.png` 민트 꽃 배경.
- `apps/web/public/floral/flower-plates.png`는 사용자가 **다시 제출한 진짜 투명 PNG**이며, 초기 배경 포함 시트를 교체했다. 주변의 밝은 직사각형 배경이 나오는 이전 시트를 되돌려 쓰지 말 것.
- `apps/web/public/floral/flower-icons.png`는 원본 투명 아이콘 시트.
- `apps/web/src/styles/flowerTheme.css`에서 게임 화면 전용 CSS 스킨을 관리한다. `apps/web/src/main.tsx`에서 마지막에 불러온다.
- 3인 고스톱 플레이어 상단 이름/점수, 획득패/손패 플레이트, 상태 메시지, 난이도/판돈, 제어 아이콘, 일부 초상화 등은 꽃 UI로 조정했다.
- 화투 **앞면 그림과 규칙/AI 난이도는 그대로**, 별도 신규 카드 뒷면 파일은 아직 없다.

## 3. 새 로비·판돈 화면 적용 상황 및 남은 작업

1. **로비 디자인 적용:** 사용자의 후속 요청 및 진행 승인(“응”)에 따라 기존 모드 선택 UI를 유지한 채 핑크·민트 꽃무늬 카드와 배경을 CSS로 입혔다. `GameHubPage.tsx`의 동작·텍스트는 그대로 유지했다.
2. `design-references/family-hwatu/lobby-mockup.png` — 기존 참고 시안. 실제 적용 그래픽은 `apps/web/public/floral/menu/` WebP 리소스를 사용한다.
3. `design-references/family-hwatu/lobby-ui-sheet.png` — 기존 분리 참고 시트. 새 메뉴 플레이트 4종을 누끼가 있는 투명 WebP로 적용했다. 실제 태블릿에서 위치·비율 최종 확인은 필요하다.
4. **판돈 설정 화면 적용:** 맞고·고스톱 모두 동일한 기존 React 판돈 버튼·금액·입장 기능을 유지하고, 투명 패널·베팅 카드 5종·전적/머니/돌아가기 플레이트를 `familyMenuTheme.css`로 입혔다. 실기기 가로/세로 반응형 QA는 미완료.
5. 꽃무늬 게임판의 실제 모바일·태블릿(특히 Lenovo P11 가로 모드) 시각 QA 및 피드백 반영.
6. 개인 사이트의 **실제 배포 링크는 여전히 이전 화면일 수 있다**. 소스 GitHub 업데이트만으로 자동 사이트 배포가 되었다고 주장하지 말 것. 사이트를 수정하거나 배포하기 전 별도의 명시적 작업 지시/권한 확인이 필요하다.
7. APK 제작 및 실기기 설치/비행기 모드/세이브 복구 테스트는 **미완료**. PWA를 APK로 만들었다고 주장하지 말 것.

## 4. 검증 완료

작업 폴더에서 다음 명령을 실행하여 모두 통과함 (2026-10-26).

```bash
npm run typecheck
npm test
npm run build:offline
```

- 타입 검사: 통과
- Vitest: 46개 스위트, **291개 테스트 통과**
- 오프라인 PWA 빌드: 통과, 정적 파일 **208개 캐시 대상**
- 실제 안드로이드 설치·오프라인 재실행은 별도 확인 필요.

## 5. 새 AI가 확인할 주요 파일

| 파일 | 용도 |
| --- | --- |
| `OFFLINE.md` | 오프라인 모드의 사용법 및 저장 구조 |
| `apps/web/src/lib/offlineApi.ts` | 서버 API 대체 및 로컬 데이터 |
| `apps/web/src/lib/offlineMode.ts` | 오프라인 빌드 분기 |
| `apps/web/src/lib/uniqueId.ts` | UUID 생성 호환성 |
| `apps/web/src/pages/GostopGamePage.tsx` | 3인 고스톱 게임 화면 및 일부 꽃 아이콘 지정 |
| `apps/web/src/styles/flowerTheme.css` | 게임판의 꽃무늬 UI 배치/크롭/반응형 스타일 |
| `apps/web/src/styles/familyMenuTheme.css` | 모드 선택/판돈 화면 전용 CSS. `main.tsx`에서 `flowerTheme.css` 다음에 불러옴 |
| `apps/web/public/floral/menu/` | 15개 투명 WebP: `menu_*`, `stake_panel`, `bet_*`, `stat_panel`, `wallet`, `continue`, `back`, `records` |
| `apps/web/public/floral/` | 이번에 실제 적용한 꽃무늬 배경/플레이트/아이콘 4개 |
| `design-references/family-hwatu/` | 원본 로비 참고 시안(보관), 실제 사용 리소스는 `/floral/menu/` |

## 6. 주의사항

- `dist-offline/`은 생성 결과물이며 Git에서는 제외됨. 브랜치를 내려받은 다음 `npm install`과 `npm run build:offline`로 재생성해야 한다.
- `file://.../index.html` 직접 실행은 지원되지 않는다. 최초 HTTPS 로딩/PWA 설치 후 캐시를 통해 오프라인 플레이하는 방식이다.
- 기기 저장 데이터 삭제 시 게임머니·전적도 없어질 수 있으며, 기기 간 자동 세이브 동기화는 없다.
- CSS에서 아틀라스를 스프라이트처럼 활용한다. 이미지 비율/배치를 변경할 때는 실제 화면에서 플레이트 외곽이 잘리는지 확인할 것.
- 이번 작업을 이어받는 AI는 **이미지를 마음대로 새로 생성하거나 UI를 재기획하지 말고**, 사용자의 다음 지시를 기다릴 것.
- **검증 구분:** 위 291개 테스트 및 빌드 성공은 이전 커밋 `a6bc17e`에서 확인한 기록이다. 새 꽃 메뉴 CSS/WebP 적용 커밋은 비공개 저장소를 작업 컨테이너에서 직접 복제하지 못해 신규 `npm test`/`build:offline`은 실행하지 못했다. CSS/정적 파일 경로만 확인했다. 배포·APK 설치·기기 QA 미실시.


## 7. 2026-10-26 후속 작업: 파스텔 UI 정리

- 사용자 요청: 기존 게임판·투명 플레이트/아이콘은 재사용하고, **코드로 그린 채도 높은 버튼·선택창·게임 팝업만** 파스텔 계열로 조정. 게임 규칙/AI/금액/화투패 앞면 변경 금지.
- 추가 파일: `apps/web/src/styles/pastelUiTheme.css` (마지막 스타일 임포트). 기존 `flowerTheme.css` 및 `familyMenuTheme.css`는 유지해 복원·비교 가능.
- 맞고: 핑크·살구·크림. 고스톱: 민트·라벤더·크림. 판돈 선택 로비에 `gostop-lobby-page` 클래스 추가해 별도 배경/색상 적용.
- 대상: 버튼·난이도·게임판 측면 정보·자동 진행·시작/딜러 선택창·고/스톱 선택·결과창·CSS 화투패 뒷면. 기존 이미지 기반 화투패 앞면은 보존.
- 꽃장식은 제목·결과창·3인 상태 정보 등에 소량만 추가. 기존 꽃무늬 배경·플레이트를 핵심 장식으로 사용.
- **검증 제한:** 새 CSS 파일의 중괄호/이미지 경로 및 JSX 클래스/임포트를 정적 점검. 이번 변경 후 전체 테스트/빌드와 Lenovo P11 실기기 시각 QA는 미실시. 이전 기록의 291개 통과는 최신 CSS에 대한 재검증이 아니다.
