## PlcApiServer 실행 가이드

### 📌 준비 사항
- .NET 8 SDK 설치 필요
- MariaDB/MySQL 연결 설정 (appsettings.json 확인)

---

### 🚀 실행 방법

#### 1️⃣ **개발 모드 (DEBUG)**
```
run.bat 더블클릭
```
- 디버그 정보 포함
- 빠른 개발 사이클
- 포트: http://localhost:5050

#### 2️⃣ **릴리스 모드 (최적화)**
```
run-release.bat 더블클릭
```
- 성능 최적화됨
- 프로덕션 환경에 적합
- 포트: http://localhost:5050

#### 3️⃣ **빌드만 하기**
```
build.bat 더블클릭
```
- 출력: `bin\Release\net8.0\`

#### 4️⃣ **배포용 패키지 생성**
```
publish.bat 더블클릭
```
- 출력: `publish-output\`
- 이 폴더를 다른 곳에 복사해서 `PlcApiServer.exe` 실행 가능

---

### 📋 각 .BAT 파일 설명

| 파일 | 용도 | 실행 시간 |
|------|------|---------|
| `run.bat` | 개발 중 테스트 실행 | ~3-5초 |
| `run-release.bat` | 최적화된 실행 | ~3-5초 |
| `build.bat` | 빌드만 수행 | ~2-3초 |
| `publish.bat` | 배포 패키지 생성 | ~3-5초 |

---

### 🌐 API 확인

서버 실행 후 브라우저에서 다음 주소로 접근:
```
http://localhost:5050/api/plc/config
```

### 📝 로그 파일 위치
- `D:\12_log\` - 12호기 신호 로그
- `D:\SC_LOG\` - 스타트/무브/엔드 신호
- `D:\START_MOVE_END\` - 상세 처리 로그

---

### ❌ 문제 해결

**포트 5050이 이미 사용 중이라면:**
1. 기존 서버 프로세스 종료
2. 또는 `Program.cs`의 포트 번호 변경 후 빌드

**데이터베이스 연결 오류:**
1. `appsettings.json` 확인
2. 연결 문자열(ConnectionString) 수정

---

### 💡 팁
- BAT 파일을 바탕화면에 바로가기 만들면 편리함
- Ctrl+C로 서버 중지
- 로그는 파일에 저장되어 문제 추적 가능
