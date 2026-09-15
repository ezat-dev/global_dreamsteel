/* ===========================================================================
   분위기제어 설비 그림 — 작화 도구가 뽑아준 index.html을 그대로 옮긴 것.

   클래스 이름은 작화 style.css(= pages/scada/atmosphereOverview.css)와 1:1로 묶여
   있어서 하나도 바꾸면 안 된다. 원본과 줄 단위로 대조할 수 있게 순서·이름을 그대로
   두었고, 바꾼 것은 세 가지다.
     - class=      → className=      (JSX 문법)
     - src="A.png" → src="/scada/atmosphere/A.png"  (public 폴더로 옮겨서 경로가 생김)
     - 기기 10개(왼쪽 위 5개, 컨트롤 밸브, 볼밸브, 경광등, 아래 화살표 2개)의 src를 at-*.svg 로 교체

   마지막 것만 설명이 필요하다. 이 5개는 원본이 68~79px이라 흐리지는 않았다. 바꾼 이유는
   색이 너무 옅어 밝은 배경에서 묻혔기 때문이다 — 특히 블로워는 거의 흰색이라 형체가
   안 보였다. 실루엣은 원본 그대로 두고 테두리와 음영만 넣었다.

   5자리에 기기는 3종이다. 가스 배관은 주황, 공기 배관은 은색으로 같은 기기가 두 벌씩
   있어서, 도형은 같고 색만 다른 파일로 나눴다 — 모양을 고칠 일이 생기면 두 파일을
   같이 고쳐야 한다(파일 머리말에도 적어 두었다).
     at-regulator-gas.svg / at-regulator-air.svg   압력 조절밸브   gas-pre / blowe-pre
     at-solenoid-gas.svg  / at-solenoid-air.svg    솔레노이드 밸브 gas-sol / blowe-sol
     at-blower.svg                                 송풍기 케이싱   motor-1
     at-beacon.svg                                 경광등          alarm-1
     at-valve-spin.svg                             컨트롤 밸브     valve-1
                                                   (연소화면 존 밸브와 같은 기기.
                                                    디스크가 도는 판이다. 정지판이
                                                    at-valve.svg 이고 도형은 똑같다 —
                                                    태그가 오면 값 1일 때 spin, 0일 때
                                                    정지판으로 src 만 갈아끼우면 된다)
     at-ballvalve.svg                              레버식 볼밸브   valve-2
     at-arrow-down.svg                             로내 투입 화살표 down-1 / down-2
                                                   (원본 두 파일이 같은 그림이라 하나만 쓴다)

   원본 PNG는 public 폴더에 그대로 두었다. 되돌리려면 src를 원래 파일명으로 바꾸면 된다
   (motor-10, gas-pre0, blowe-pre0, gas-sol0, blowe-sol0, alarm-10, valve-10, valve-20, down-10, down-20).

   그림은 1801x742px 고정 크기다. 화면에 맞춰 줄이는 일은 이 컴포넌트를 감싸는
   쪽(AtmospherePage)에서 transform: scale로 처리한다.
   =========================================================================== */

export default function AtmosphereOverview() {
  return (
    <div className="atmosphere">
      <div className="pipe-1"></div>
      <div className="pipe-2"></div>
      <div className="pipe-3"></div>
      <div className="pipe-4"></div>
      <div className="pipe-5"></div>
      <div className="pipe-6"></div>
      <div className="pipe-7"></div>
      <div className="pipe-8"></div>
      <div className="pipe-9"></div>
      <div className="pipe-10"></div>
      <img className="blowe" src="/scada/atmosphere/blowe0.png" />
      <img className="gas" src="/scada/atmosphere/gas0.png" />
      <img className="obj-1" src="/scada/atmosphere/obj-10.png" />
      <img className="obj-2" src="/scada/atmosphere/obj-20.png" />
      <img className="obj-3" src="/scada/atmosphere/obj-30.png" />
      <img className="obj-4" src="/scada/atmosphere/obj-40.png" />
      <img className="valve-1" src="/scada/atmosphere/at-valve-spin.svg" />
      <img className="valve-2" src="/scada/atmosphere/at-ballvalve.svg" />
      <img className="motor-1" src="/scada/atmosphere/at-blower.svg" />
      <img className="blowe-pre" src="/scada/atmosphere/at-regulator-air.svg" />
      <img className="blowe-sol" src="/scada/atmosphere/at-solenoid-air.svg" />
      <img className="gas-pre" src="/scada/atmosphere/at-regulator-gas.svg" />
      <img className="gas-sol" src="/scada/atmosphere/at-solenoid-gas.svg" />
      <img className="down-1" src="/scada/atmosphere/at-arrow-down.svg" />
      <img className="down-2" src="/scada/atmosphere/at-arrow-down.svg" />
      <img className="alarm-1" src="/scada/atmosphere/at-beacon.svg" />
    </div>
  );
}
