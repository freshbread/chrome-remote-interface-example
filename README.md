# Chrome Remote Interface Example

이 프로젝트는 [chrome-remote-interface](https://github.com/cyrus-and/chrome-remote-interface) 라이브러리를 활용하여, Chrome DevTools Protocol을 통해 웹 페이지의 데이터를 자동으로 수집하는 예제입니다.

## 📋 요구 사항 (Requirements)

* **Node.js**: `v16.20.2` 이상 (상위 버전 호환 가능)
* **Google Chrome**: 원격 디버깅 모드 실행 필요

---

## ⚙️ 설치 및 설정 (Installation)

### 1. Node.js 환경 구축
1. [Node.js 공식 홈페이지](https://nodejs.org/)에서 설치 파일을 내려받아 설치합니다.
2. **시스템 환경 변수 설정**:
    - `NODE_HOME`: Node.js 설치 경로 등록
    - `Path`: `%NODE_HOME%` 및 `%NODE_HOME%\bin` 경로를 추가하여 터미널 어디서든 `node` 명령어를 사용하도록 설정합니다.

### 2. 의존성 패키지 설치
`package.json` 파일이 있는 프로젝트 루트 폴더에서 아래 명령어를 입력합니다.

```bash
npm install
```

---

## 🚀 실행 방법 (Usage)

### 1. 크롬 원격 디버깅 활성화
스크립트가 브라우저를 제어할 수 있도록 아래 명령어로 크롬을 실행합니다. (실행 전 모든 크롬 창을 닫아주세요.)

```bash
# Windows 기준
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
```

### 2. 스크립트 실행
터미널에서 `node` 명령어를 사용하여 대상 URL을 파라미터로 전달합니다.

```bash
# 실행 구문
node <SCRIPT_PATH> <TARGET_URL>

# 실행 예시
node .\getPage.js [https://www.google.com](https://www.google.com)
```

---

## 🛠 구성 파일
| 파일명 | 역할 |
| :--- | :--- |
| `getPage.js` | `chrome-remote-interface`를 활용한 페이지 로드 및 데이터 추출 로직 |
| `package.json` | 프로젝트 정보 및 라이브러리 의존성 관리 |

---

> **Note**: 스크립트 실행 전, 크롬이 `--remote-debugging-port=9222`로 정상 실행 중인지 반드시 확인하세요.