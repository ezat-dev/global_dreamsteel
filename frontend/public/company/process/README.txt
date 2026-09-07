로그인 화면 배경 워터마크용 이미지 폴더.

글로벌드림스틸 홈페이지 "인발 공정과정" 이미지 8장을 아래 이름으로 저장한다.
(크롬에서 이미지 우클릭 -> 이미지를 다른 이름으로 저장)

  in-01.png   STEP 01  원소재 입고
  in-02.png   STEP 02  열처리      <- 이 시스템이 제어하는 공정
  in-03.png   STEP 03  표면처리
  in-04.png   STEP 04  구부작업
  in-05.png   STEP 05  인발
  in-06.png   STEP 06  교정
  in-07.png   STEP 07  절단
  in-08.png   STEP 08  ECT 검사

- 배경이 흰색이어도 된다. CSS(.hmi-login-watermark)에서 반전 + screen 합성으로
  흰 배경을 날리고 외곽선만 남긴다.
- jpg로 저장했으면 확장자에 맞춰 ScadaLoginPage.jsx의 PROCESS_STEPS를 고친다.
- 파일이 없으면 해당 칸만 비고 화면은 정상 동작한다.
