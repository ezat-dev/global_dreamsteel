/* ===========================================================================
   쿨링타워 설비 그림 — 작화 도구가 뽑아준 index.html을 그대로 옮긴 것.

   클래스 이름은 작화 style.css(= pages/scada/coolingOverview.css)와 1:1로 묶여 있어서
   하나도 바꾸면 안 된다. 원본과 줄 단위로 대조할 수 있게 순서·이름을 그대로 두었고,
   바꾼 것은 딱 두 가지다.
     - class=      → className=      (JSX 문법)
     - src="A.png" → src="/scada/cooling/A.png"  (public 폴더로 옮겨서 경로가 생김)

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
      <img className="pump-1" src="/scada/cooling/pump-10.png" />
      <img className="pump-2" src="/scada/cooling/pump-20.png" />
      <img className="pump-3" src="/scada/cooling/pump-30.png" />
      <img className="pump-4" src="/scada/cooling/pump-40.png" />
      <img className="obj-1" src="/scada/cooling/obj-10.png" />
      <img className="obj-2" src="/scada/cooling/obj-20.png" />
      <img className="obj-3" src="/scada/cooling/obj-30.png" />
      <img className="obj-4" src="/scada/cooling/obj-40.png" />
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
      <img className="obj-19" src="/scada/cooling/obj-190.png" />
      <img className="obj-20" src="/scada/cooling/obj-200.png" />
      <img className="motor-1" src="/scada/cooling/motor-10.png" />
      <img className="arrow-1" src="/scada/cooling/arrow-10.png" />
      <img className="arrow-2" src="/scada/cooling/arrow-20.png" />
      <img className="arrow-3" src="/scada/cooling/arrow-30.png" />
      <img className="arrow-4" src="/scada/cooling/arrow-40.png" />
      <img className="arrow-5" src="/scada/cooling/arrow-50.png" />
      <img className="arrow-6" src="/scada/cooling/arrow-60.png" />
      <img className="arrow-7" src="/scada/cooling/arrow-70.png" />
      <img className="arrow-8" src="/scada/cooling/arrow-80.png" />
      <img className="arrow-9" src="/scada/cooling/arrow-90.png" />
      <img className="arrow-10" src="/scada/cooling/arrow-100.png" />
      <img className="arrow-11" src="/scada/cooling/arrow-110.png" />
      <img className="arrow-12" src="/scada/cooling/arrow-120.png" />
    </div>
  );
}
