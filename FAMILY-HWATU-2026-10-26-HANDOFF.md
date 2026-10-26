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

## 3. 아직 완료되지 않은 작업 — 새 AI가 임의로 진행하지 말 것

1. **새 첫 화면(로비) 구현:** 사용자가 로비 시안 및 UI 시트를 보내셨으나, 이번 작업에서는 **참고 파일로만 저장**, 실제 로비 코드는 미수정.
2. `design-references/family-hwatu/lobby-mockup.png` — 최종이라고 확정된 것은 아닌 로비 구성 참고 이미지.
3. `design-references/family-hwatu/lobby-ui-sheet.png` — 로비 그래픽 분리/적용용 참고 시트. 누끼·비율을 확인하고 적용 전 사용자에게 최종 확정을 받을 것.
4. 판돈 설정 화면을 비롯한 다른 화면의 디자인은 사용자가 별도로 제작 중이다. 아직 통합 지시를 받지 않았다.
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
| `apps/web/src/styles/flowerTheme.css` | 꽃무늬 UI 배치/크롭/반응형 스타일 |
| `apps/web/public/floral/` | 이번에 실제 적용한 꽃무늬 배경/플레이트/아이콘 4개 |
| `design-references/family-hwatu/` | 아직 **적용하지 않은** 다음 로비 참고자료 |

## 6. 주의사항

- `dist-offline/`은 생성 결과물이며 Git에서는 제외됨. 브랜치를 내려받은 다음 `npm install`과 `npm run build:offline`로 재생성해야 한다.
- `file://.../index.html` 직접 실행은 지원되지 않는다. 최초 HTTPS 로딩/PWA 설치 후 캐시를 통해 오프라인 플레이하는 방식이다.
- 기기 저장 데이터 삭제 시 게임머니·전적도 없어질 수 있으며, 기기 간 자동 세이브 동기화는 없다.
- CSS에서 아틀라스를 스프라이트처럼 활용한다. 이미지 비율/배치를 변경할 때는 실제 화면에서 플레이트 외곽이 잘리는지 확인할 것.
- 이번 작업을 이어받는 AI는 **이미지를 마음대로 새로 생성하거나 UI를 재기획하지 말고**, 사용자의 다음 지시를 기다릴 것.

