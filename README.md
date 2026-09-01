# GLOBAL DREAM STEEL — SCADA

열처리로 현장 모니터링(SCADA/HMI) 웹. Spring Boot(MyBatis) 백엔드 + React(Vite) 프론트엔드.

## 기술 스택

- Backend: Java 17, Spring Boot 3.5.x, MyBatis(수동 SqlSession + Dao/DaoImpl), MariaDB
- Frontend: React 18, Vite, React Router, Recharts
- PLC 통신: C# / ASP.NET Core 8 (별도 서버)

## 폴더 구조

```
backend/    Spring Boot (com.mes: controller/service/service.impl/dao/dao.impl/domain)
frontend/   React — 상단 제목바 + 하단 메뉴바의 HMI 레이아웃
C#/         PlcApiServer — LS / 미쓰비시 MC / Modbus TCP 통신, 알람·온도 폴링 (포트 5050)
sample_pro/ 기존 JSP SCADA (참고용, 빌드 대상 아님)
```

## 화면

하단 메뉴바 10개. 라우팅과 상단 제목은 `frontend/src/constants/scadaMenu.js` 하나로 관리한다.

| 메뉴 | 경로 |
|---|---|
| 메인화면 | `/` |
| 구동화면 | `/drive` |
| 연소화면 | `/combustion` |
| 온도제어 | `/temp` |
| 분위기제어 | `/atmosphere` |
| 쿨링타워 | `/cooling` |
| 트랜드 | `/trend` |
| 알람화면 | `/alarm` |
| 경보이력 | `/alarmHistory` |
| 로그 | `/log` |

로그인 화면은 `/login`(메뉴바 없음).

### 로고

`frontend/public/logo.png` 하나를 상단 좌측과 로그인 카드 양쪽에서 쓴다(`components/scada/ScadaLogo.jsx`).
파일만 갈아끼우면 되고 빌드는 필요 없다. 파일이 없으면 "(주)글로벌드림스틸" 텍스트가 대신 나온다.

## 실행

| 스크립트 | 띄우는 것 |
|---|---|
| `run-web.bat` | 백엔드(8081) + 프론트엔드(5051) — 화면 작업할 땐 이것만 있으면 된다 |
| `run-all.bat` | 위 둘 + PlcApiServer(5050) |
| `stop-all.bat` | 전부 종료 (창 제목과 포트 양쪽으로 정리) |

처음 받았다면 `run-backend.bat.example`을 `run-backend.bat`으로 복사하고 `DB_PASSWORD`를 채워야 한다
(이 파일은 gitignore 대상이라 실제 비밀번호가 커밋되지 않는다). 프론트엔드는 최초 1회 `cd frontend && npm install`.

개별 실행은 `run-backend.bat` / `run-frontend.bat` / `run-csharp.bat`.

## DB

`global_dreamsteel` 스키마 (기본값 192.168.1.45:3306). 접속 설정은 두 군데다.

- `backend/src/main/resources/application.yml` — `spring.datasource` (계정/비번은 환경변수)
- `run-backend.bat` — `DB_USERNAME` / `DB_PASSWORD` 주입

호스트·포트·스키마를 바꾸려면 `DB_HOST` / `DB_PORT` / `DB_NAME`을 같이 넣으면 된다.

접속하는 PC가 DB 서버에서 허용돼 있어야 한다. 안 되어 있으면
`Host '...' is not allowed to connect to this MariaDB server` (Error 1130)가 난다.

```sql
CREATE USER 'root'@'%' IDENTIFIED BY '...';
GRANT ALL PRIVILEGES ON global_dreamsteel.* TO 'root'@'%';
FLUSH PRIVILEGES;
```

### 테이블

```sql
CREATE TABLE `user` (
  `id`            INT(11)     NOT NULL AUTO_INCREMENT,
  `user_id`       VARCHAR(50) NOT NULL DEFAULT '0',
  `user_password` VARCHAR(50) NOT NULL DEFAULT '0',
  `user_name`     VARCHAR(50) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;
```

`user`는 MariaDB 예약어와 겹치므로 쿼리에서 항상 백틱으로 감싼다.

## 현재 구현 범위

- 화면 뼈대(로고 / 상단 제목바 / 하단 메뉴바 / 라우팅) 완성, 10개 화면 내용은 미작업
- 로그인 — `POST /api/scada/login`, `global_dreamsteel.user` 조회까지 연결됨

비밀번호는 평문 비교다(`user_password`가 VARCHAR(50)이라 BCrypt 해시 60자가 안 들어간다).
해시로 바꾸려면 컬럼 길이부터 늘려야 한다.
