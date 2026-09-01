/* ===========================================================================
   분위기제어 설비 그림 — 작화 도구가 뽑아준 index.html을 그대로 옮긴 것.

   클래스 이름은 작화 style.css(= pages/scada/atmosphereOverview.css)와 1:1로 묶여
   있어서 하나도 바꾸면 안 된다. 원본과 줄 단위로 대조할 수 있게 순서·이름을 그대로
   두었고, 바꾼 것은 딱 두 가지다.
     - class=      → className=      (JSX 문법)
     - src="A.png" → src="/scada/atmosphere/A.png"  (public 폴더로 옮겨서 경로가 생김)

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
      <img className="valve-1" src="/scada/atmosphere/valve-10.png" />
      <img className="valve-2" src="/scada/atmosphere/valve-20.png" />
      <img className="motor-1" src="/scada/atmosphere/motor-10.png" />
      <img className="blowe-pre" src="/scada/atmosphere/blowe-pre0.png" />
      <img className="blowe-sol" src="/scada/atmosphere/blowe-sol0.png" />
      <img className="gas-pre" src="/scada/atmosphere/gas-pre0.png" />
      <img className="gas-sol" src="/scada/atmosphere/gas-sol0.png" />
      <img className="down-1" src="/scada/atmosphere/down-10.png" />
      <img className="down-2" src="/scada/atmosphere/down-20.png" />
      <img className="alarm-1" src="/scada/atmosphere/alarm-10.png" />
    </div>
  );
}
