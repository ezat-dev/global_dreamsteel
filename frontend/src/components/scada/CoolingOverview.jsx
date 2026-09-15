/* ===========================================================================
   쿨링타워 설비 그림 — 작화 도구가 뽑아준 index.html을 그대로 옮긴 것.

   클래스 이름은 작화 style.css(= pages/scada/coolingOverview.css)와 1:1로 묶여 있어서
   하나도 바꾸면 안 된다. 원본과 줄 단위로 대조할 수 있게 순서·이름을 그대로 두었고,
   바꾼 것은 세 가지다.
     - class=      → className=      (JSX 문법)
     - src="A.png" → src="/scada/cooling/A.png"  (public 폴더로 옮겨서 경로가 생김)
     - 흐름 화살표 12개 + 펌프 4개 + 모터 1개 + 타워 본체 1개 + 수조 2개 + 탱크 2개의 src를 ct-*.svg 로 교체

   마지막 것만 설명이 필요하다. 화살표는 38~45px짜리 작은 PNG인데 화면에서 그림을 늘려
   그리므로 흐려지고 찌그러진다. 같은 실루엣으로 SVG를 다시 그려 끼웠다.

   12자리에 SVG는 3개뿐이다. 파일은 12개였지만 실제 그림은 오른쪽·위·아래 세 방향이고,
   왼쪽은 작화 CSS가 scale(-1,1)로 뒤집어 만든다. 세 파일은 같은 도형을 rotate로 돌린
   것이라 모양을 고치면 셋을 같이 고쳐야 한다(파일 머리말에도 적어 두었다).
     ct-arrow-right.svg  arrow-1 / arrow-6 / arrow-7~12
     ct-arrow-up.svg     arrow-2
     ct-arrow-down.svg   arrow-3 / arrow-4 / arrow-5
     ct-pump.svg         pump-1~4   (원본 pump-10 / pump-30 은 픽셀의 7%만 다른 사실상
                                     같은 그림이라 하나로 합쳤다. pump-3·4는 CSS가 좌우 반전)
     ct-motor.svg        motor-1
     ct-tower.svg        obj-1      (흐려서가 아니라 면이 전부 단색이라 납작해 보여서 바꿨다.
                                     실루엣은 그대로 두고 음영만 넣었다)
     ct-tank-small.svg   obj-2      작은 수조 (틀과 물이 한 그림)
     ct-tank-frame.svg   obj-3      큰 수조의 틀
     ct-water.svg        obj-4      큰 수조의 물
                                    물이 단색 #00CCFF 사각형이라 색칠한 판으로 보였다.
                                    깊이 음영 + 수면선 + 옅은 반사를 넣었다.
                                    작은 수조와 큰 수조의 물 색은 같은 값을 쓴다 —
                                    한쪽만 고치면 한 화면에서 따로 논다.
     ct-vessel.svg       obj-19 / obj-20   COOLING CHAMBER 와 RX-발생기 탱크 (같은 그림)
                                    원본이 세로 그라데이션 한 장뿐이었고 그것도 위아래가
                                    희고 가운데가 어두워 홈처럼 보였다. 누운 원통 음영으로
                                    뒤집고 테두리·끝단·받침을 넣었다.

   배관 38자리는 일부러 두었다. 원본에 이미 원통 음영이 구워져 있어 파이프처럼 보이고,
   이 화면은 그림을 줄이기만 해서(CoolingPage 의 Math.min) 흐려질 일도 없다.
   게다가 회전·반전까지 따져도 21종이라 — 엘보마다 빛 받는 면이 달라 서로 돌려 쓸 수
   없다 — 손으로 다시 그리면 이음매가 어긋날 위험이 이득보다 크다.

   원본 PNG는 public 폴더에 그대로 두었다. 되돌리려면 src를 원래 파일명으로 바꾸면 된다
   (arrow-10 ~ arrow-120, pump-10·30, motor-10, obj-10·20·30·40·190 — 번호가 클래스 번호 + "0" 이다).

   그림은 1496x708px 고정 크기다. 화면에 맞춰 줄이는 일은 이 컴포넌트를 감싸는
   쪽(CoolingPage)에서 transform: scale로 처리한다 — 작화 CSS는 건드리지 않는다.
   =========================================================================== */

export default function CoolingOverview() {
  return (
    <div className="cooling-tower">
      <img className="pipe-1" src="/scada/cooling/pipe-10.png" />
      <img className="pipe-2" src="/scada/cooling/pipe-20.png" />
      <img className="pipe-3" src="/scada/cooling/pipe-30.png" />
      <img className="pipe-4" src="/scada/cooling/pipe-40.png" />
      <img className="pipe-5" src="/scada/cooling/pipe-50.png" />
      <img className="pipe-6" src="/scada/cooling/pipe-60.png" />
      <img className="pipe-7" src="/scada/cooling/pipe-70.png" />
      <img className="pipe-8" src="/scada/cooling/pipe-80.png" />
      <img className="pipe-9" src="/scada/cooling/pipe-90.png" />
      <img className="pipe-10" src="/scada/cooling/pipe-100.png" />
      <img className="pipe-11" src="/scada/cooling/pipe-110.png" />
      <img className="pipe-12" src="/scada/cooling/pipe-120.png" />
      <img className="pipe-13" src="/scada/cooling/pipe-130.png" />
      <img className="pipe-14" src="/scada/cooling/pipe-140.png" />
      <img className="pipe-15" src="/scada/cooling/pipe-150.png" />
      <img className="pipe-16" src="/scada/cooling/pipe-160.png" />
      <img className="pipe-17" src="/scada/cooling/pipe-170.png" />
      <img className="pipe-18" src="/scada/cooling/pipe-180.png" />
      <img className="pipe-19" src="/scada/cooling/pipe-190.png" />
      <img className="pipe-20" src="/scada/cooling/pipe-200.png" />
      <img className="pipe-21" src="/scada/cooling/pipe-210.png" />
      <img className="pipe-22" src="/scada/cooling/pipe-220.png" />
      <img className="pipe-23" src="/scada/cooling/pipe-230.png" />
      <img className="pipe-24" src="/scada/cooling/pipe-240.png" />
      <img className="pipe-25" src="/scada/cooling/pipe-250.png" />
      <img className="pipe-26" src="/scada/cooling/pipe-260.png" />
      <img className="pipe-27" src="/scada/cooling/pipe-270.png" />
      <img className="pipe-28" src="/scada/cooling/pipe-280.png" />
      <img className="pipe-29" src="/scada/cooling/pipe-290.png" />
      <img className="pipe-30" src="/scada/cooling/pipe-300.png" />
      <img className="pipe-31" src="/scada/cooling/pipe-310.png" />
      <img className="pipe-32" src="/scada/cooling/pipe-320.png" />
      <img className="pipe-33" src="/scada/cooling/pipe-330.png" />
      <img className="pipe-34" src="/scada/cooling/pipe-340.png" />
      <img className="pipe-35" src="/scada/cooling/pipe-350.png" />
      <img className="pipe-36" src="/scada/cooling/pipe-360.png" />
      <img className="pipe-37" src="/scada/cooling/pipe-370.png" />
      <img className="pipe-38" src="/scada/cooling/pipe-380.png" />
      <img className="pump-1" src="/scada/cooling/ct-pump.svg" />
      <img className="pump-2" src="/scada/cooling/ct-pump.svg" />
      <img className="pump-3" src="/scada/cooling/ct-pump.svg" />
      <img className="pump-4" src="/scada/cooling/ct-pump.svg" />
      <img className="obj-1" src="/scada/cooling/ct-tower.svg" />
      <img className="obj-2" src="/scada/cooling/ct-tank-small.svg" />
      <img className="obj-3" src="/scada/cooling/ct-tank-frame.svg" />
      <img className="obj-4" src="/scada/cooling/ct-water.svg" />
      <img className="obj-5" src="/scada/cooling/obj-50.png" />
      <img className="obj-6" src="/scada/cooling/obj-60.png" />
      <img className="obj-7" src="/scada/cooling/obj-70.png" />
      <img className="obj-8" src="/scada/cooling/obj-80.png" />
      <img className="obj-9" src="/scada/cooling/obj-90.png" />
      <img className="obj-10" src="/scada/cooling/obj-100.png" />
      <img className="obj-11" src="/scada/cooling/obj-110.png" />
      <img className="obj-12" src="/scada/cooling/obj-120.png" />
      <img className="obj-13" src="/scada/cooling/obj-130.png" />
      <img className="obj-14" src="/scada/cooling/obj-140.png" />
      <img className="obj-15" src="/scada/cooling/obj-150.png" />
      <img className="obj-16" src="/scada/cooling/obj-160.png" />
      <img className="obj-17" src="/scada/cooling/obj-170.png" />
      <img className="obj-18" src="/scada/cooling/obj-180.png" />
      <img className="obj-19" src="/scada/cooling/ct-vessel.svg" />
      <img className="obj-20" src="/scada/cooling/ct-vessel.svg" />
      <img className="motor-1" src="/scada/cooling/ct-motor.svg" />
      <img className="arrow-1" src="/scada/cooling/ct-arrow-right.svg" />
      <img className="arrow-2" src="/scada/cooling/ct-arrow-up.svg" />
      <img className="arrow-3" src="/scada/cooling/ct-arrow-down.svg" />
      <img className="arrow-4" src="/scada/cooling/ct-arrow-down.svg" />
      <img className="arrow-5" src="/scada/cooling/ct-arrow-down.svg" />
      <img className="arrow-6" src="/scada/cooling/ct-arrow-right.svg" />
      <img className="arrow-7" src="/scada/cooling/ct-arrow-right.svg" />
      <img className="arrow-8" src="/scada/cooling/ct-arrow-right.svg" />
      <img className="arrow-9" src="/scada/cooling/ct-arrow-right.svg" />
      <img className="arrow-10" src="/scada/cooling/ct-arrow-right.svg" />
      <img className="arrow-11" src="/scada/cooling/ct-arrow-right.svg" />
      <img className="arrow-12" src="/scada/cooling/ct-arrow-right.svg" />
    </div>
  );
}
