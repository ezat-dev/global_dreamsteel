import { memo } from 'react';
import {
  ROLLER_TAGS, artTitle, arrowTitle, doorTitle, motorTitle, railTitle, zoneTitle,
} from './driveArtTags';

/* ===========================================================================
   구동화면 설비 그림 — 작화 도구가 뽑아준 index.html을 그대로 옮긴 것.

   클래스 이름은 작화 style.css(= pages/scada/driveOverview.css)와 1:1로 묶여 있어서
   하나도 바꾸면 안 된다. 원본과 줄 단위로 대조할 수 있게 순서·이름을 그대로 두었고,
   바꾼 것은 세 가지다.
     - class=      → className=      (JSX 문법)
     - src="A.png" → src="/scada/drive/A.png"  (public 폴더로 옮겨서 경로가 생김)
     - 모터 11개 / 화살표 16개 / 롤러 18개의 src를 SVG로 교체

   마지막 것만 설명이 필요하다. 이것들은 20x41 같은 작은 PNG인데 화면에서 그림을 늘려
   그리므로 흐려지고 찌그러진다. 같은 실루엣으로 SVG를 다시 그려 끼웠다.

   45자리에 SVG는 7개뿐이다. 파일은 45개였지만 실제 그림은 7종이고(나머지는 같은
   그림의 고해상도판), 자리마다 방향이 다른 것은 작화 CSS가 scale(-1,1)로 뒤집어
   주기 때문이다. 그래서 파일 하나를 여러 자리에 그대로 끼워도 방향이 유지된다.
     motor-h.svg     가로 기어드 모터 ent-motor-1 / exit-motor-1 / exit-motor-2 / exit-motor-4
     motor-drum.svg  통 모터          ent-motor-2 / exit-motor-3
     motor-v1.svg    세로 기어드 모터 ent-motor-3
     motor-v2.svg    세로 모터+감속기 ent-motor-4 / main-motor-1 / main-motor-2 / exit-motor-5
     arrow-up.svg    위 화살표        ent-up-1~4 / exit-up-1~4
     arrow-down.svg  아래 화살표      ent-down-1~4 / exit-down-1~4
     roller.svg      컨베이어 롤러    ent-conv-1~12
     roller-exit.svg 컨베이어 롤러    exit-conv-1~6
                     (같은 그림인데 표면 자국 흐르는 방향만 반대다. 출구 쪽은 작화 CSS가
                      scale(-1,1)로 뒤집어 그려서, 파일 안에서 반대로 흘려야 화면에서
                      입구와 같은 방향으로 돈다)
     roller-still.svg 멈춘 롤러       위 두 자리 공용

   롤러가 도는지 마는지는 PLC 값으로 정해진다(entRolling / exitRolling). <img>로 띄운
   SVG 안의 애니메이션은 바깥 CSS로 멈출 수 없어서, 클래스를 붙이는 대신 파일을 바꿔
   끼운다 — 멈춘 그림은 흐르는 방향이 없으므로 입구·출구가 한 파일을 같이 쓴다.

   값을 받는 건 이 두 개뿐이다. 그림 전체가 memo로 묶여 있는데(요소 571개) 값이 1초마다
   바뀌는 것을 여기까지 들이면 매 초 전부 다시 비교하게 되므로, 판단은 DrivePage에서
   끝내고 여기로는 결론(boolean)만 넘긴다. 그래서 롤러가 실제로 멈추거나 돌 때만
   다시 그려진다.

   각 SVG의 viewBox는 그 자리의 칸 비율에 맞춰 두었다. 작화 CSS에 object-fit: cover가
   걸려 있어서 비율이 어긋나면 그림이 잘린다 — SVG를 고칠 때 viewBox를 건드리면
   해당 칸의 width/height 비율과 같은지 반드시 확인할 것.

   원본 PNG는 public 폴더에 그대로 두었다. 되돌리려면 src를 원래 파일명으로 바꾸면 된다
   (ent-motor-10~40, main-motor-10·20, exit-motor-10~50, ent/exit-up-10~40,
    ent/exit-down-10~40, ent-conv-10~120, exit-conv-10~60).

   그림은 1981x406px 고정 크기다. 화면 폭에 맞춰 줄이는 일은 이 컴포넌트를 감싸는
   쪽(DrivePage)에서 transform: scale로 처리한다 — 작화 CSS는 건드리지 않는다.
   =========================================================================== */

function DriveOverview({ entRolling = true, exitRolling = true }) {
  /* 기본값이 true인 것은 이 컴포넌트를 값 없이 써도 예전처럼 도는 그림이 나오게 하려는 것이다. */
  const entRoller = entRolling ? '/scada/drive/roller.svg' : '/scada/drive/roller-still.svg';
  const exitRoller = exitRolling ? '/scada/drive/roller-exit.svg' : '/scada/drive/roller-still.svg';

  /* 그림 위 요소에 붙는 태그 이름 툴팁. 값이 아니라 이름이라 매번 같은 글이고,
     memo와 상관없이 한 번 그려지면 그대로 남는다.

     모터는 회색(값 0)이어도 툴팁은 떠야 한다 — 값이 안 들어올 때야말로 어느 태그를
     봐야 하는지 알아야 하기 때문이다. 회색은 filter라 마우스를 막지 않으니 그냥 뜬다. */
  const entRailTitle = railTitle('ent');
  const exitRailTitle = railTitle('exit');
  const entRollerTitle = artTitle(ROLLER_TAGS.ent);
  const exitRollerTitle = artTitle(ROLLER_TAGS.exit);

  return (
    <div className="overview-1">
      <div className="entrance-conv">
        <img className="ent-obj-1" src="/scada/drive/ent-obj-10.png" />
        <img className="ent-obj-2" src="/scada/drive/ent-obj-20.png" />
        <img className="ent-obj-3" src="/scada/drive/ent-obj-30.png" />
        <img className="ent-obj-4" src="/scada/drive/ent-obj-40.png" />
        <img className="ent-obj-5" src="/scada/drive/ent-obj-50.png" />
        <img className="ent-obj-6" src="/scada/drive/ent-obj-60.png" />
        <img className="ent-conv-1" src={entRoller} title={entRollerTitle} />
        <img className="ent-conv-2" src={entRoller} title={entRollerTitle} />
        <img className="ent-conv-3" src={entRoller} title={entRollerTitle} />
        <img className="ent-conv-4" src={entRoller} title={entRollerTitle} />
        <img className="ent-conv-5" src={entRoller} title={entRollerTitle} />
        <img className="ent-conv-6" src={entRoller} title={entRollerTitle} />
        <img className="ent-conv-7" src={entRoller} title={entRollerTitle} />
        <img className="ent-conv-8" src={entRoller} title={entRollerTitle} />
        <img className="ent-conv-9" src={entRoller} title={entRollerTitle} />
        <img className="ent-conv-10" src={entRoller} title={entRollerTitle} />
        <img className="ent-conv-11" src={entRoller} title={entRollerTitle} />
        <img className="ent-conv-12" src={entRoller} title={entRollerTitle} />
        <img className="ent-obj-7" src="/scada/drive/ent-obj-70.png" />
        <img className="ent-obj-8" src="/scada/drive/ent-obj-80.png" />
        <img className="ent-obj-9" src="/scada/drive/ent-obj-90.png" />
        <img className="ent-obj-10" src="/scada/drive/ent-obj-100.png" />
        <img className="ent-obj-11" src="/scada/drive/ent-obj-110.png" />
        <img className="ent-obj-12" src="/scada/drive/ent-obj-120.png" />
        <img className="ent-obj-13" src="/scada/drive/ent-obj-130.png" />
        <img className="ent-obj-14" src="/scada/drive/ent-obj-140.png" />
        <img className="ent-obj-15" src="/scada/drive/ent-obj-150.png" />
        <img className="ent-obj-16" src="/scada/drive/ent-obj-160.png" />
        <img className="ent-obj-17" src="/scada/drive/ent-obj-170.png" />
        <img className="ent-obj-18" src="/scada/drive/ent-obj-180.png" />
        <div className="ent-obj-19"></div>
        <div className="ent-obj-20"></div>
        <div className="ent-obj-21"></div>
        <div className="ent-obj-22"></div>
        <div className="ent-obj-23"></div>
        <div className="ent-obj-24"></div>
        <div className="ent-rail-1">
          <div className="mini-rail" title={entRailTitle}></div>
          <div className="mini-rail2" title={entRailTitle}></div>
          <div className="mini-rail3" title={entRailTitle}></div>
          <div className="mini-rail4" title={entRailTitle}></div>
          <div className="mini-rail5" title={entRailTitle}></div>
          <div className="mini-rail6" title={entRailTitle}></div>
          <div className="mini-rail7" title={entRailTitle}></div>
          <div className="mini-rail8" title={entRailTitle}></div>
          <div className="mini-rail9" title={entRailTitle}></div>
          <div className="mini-rail10" title={entRailTitle}></div>
          <div className="mini-rail11" title={entRailTitle}></div>
          <div className="mini-rail12" title={entRailTitle}></div>
          <div className="mini-rail13" title={entRailTitle}></div>
          <div className="mini-rail14" title={entRailTitle}></div>
          <div className="mini-rail15" title={entRailTitle}></div>
          <div className="mini-rail16" title={entRailTitle}></div>
          <div className="mini-rail17" title={entRailTitle}></div>
          <div className="mini-rail18" title={entRailTitle}></div>
          <div className="mini-rail19" title={entRailTitle}></div>
          <div className="mini-rail20" title={entRailTitle}></div>
          <div className="mini-rail21" title={entRailTitle}></div>
          <div className="mini-rail22" title={entRailTitle}></div>
          <div className="mini-rail23" title={entRailTitle}></div>
          <div className="mini-rail24" title={entRailTitle}></div>
          <div className="mini-rail25" title={entRailTitle}></div>
          <div className="mini-rail26" title={entRailTitle}></div>
          <div className="mini-rail27" title={entRailTitle}></div>
          <div className="mini-rail28" title={entRailTitle}></div>
          <div className="mini-rail29" title={entRailTitle}></div>
          <div className="mini-rail30" title={entRailTitle}></div>
          <div className="mini-rail31" title={entRailTitle}></div>
          <div className="mini-rail32" title={entRailTitle}></div>
          <div className="mini-rail33" title={entRailTitle}></div>
          <div className="mini-rail34" title={entRailTitle}></div>
          <div className="mini-rail35" title={entRailTitle}></div>
          <div className="mini-rail36" title={entRailTitle}></div>
          <div className="mini-rail37" title={entRailTitle}></div>
          <div className="mini-rail38" title={entRailTitle}></div>
          <div className="mini-rail39" title={entRailTitle}></div>
        </div>
        <div className="ent-rail-2">
          <div className="mini-rail40" title={entRailTitle}></div>
          <div className="mini-rail41" title={entRailTitle}></div>
          <div className="mini-rail42" title={entRailTitle}></div>
          <div className="mini-rail43" title={entRailTitle}></div>
          <div className="mini-rail44" title={entRailTitle}></div>
          <div className="mini-rail45" title={entRailTitle}></div>
          <div className="mini-rail46" title={entRailTitle}></div>
          <div className="mini-rail47" title={entRailTitle}></div>
          <div className="mini-rail48" title={entRailTitle}></div>
          <div className="mini-rail49" title={entRailTitle}></div>
          <div className="mini-rail50" title={entRailTitle}></div>
          <div className="mini-rail51" title={entRailTitle}></div>
          <div className="mini-rail52" title={entRailTitle}></div>
          <div className="mini-rail53" title={entRailTitle}></div>
          <div className="mini-rail54" title={entRailTitle}></div>
          <div className="mini-rail55" title={entRailTitle}></div>
          <div className="mini-rail56" title={entRailTitle}></div>
          <div className="mini-rail57" title={entRailTitle}></div>
          <div className="mini-rail58" title={entRailTitle}></div>
          <div className="mini-rail59" title={entRailTitle}></div>
          <div className="mini-rail60" title={entRailTitle}></div>
          <div className="mini-rail61" title={entRailTitle}></div>
          <div className="mini-rail62" title={entRailTitle}></div>
          <div className="mini-rail63" title={entRailTitle}></div>
          <div className="mini-rail64" title={entRailTitle}></div>
          <div className="mini-rail65" title={entRailTitle}></div>
          <div className="mini-rail66" title={entRailTitle}></div>
          <div className="mini-rail67" title={entRailTitle}></div>
          <div className="mini-rail68" title={entRailTitle}></div>
          <div className="mini-rail69" title={entRailTitle}></div>
          <div className="mini-rail70" title={entRailTitle}></div>
          <div className="mini-rail71" title={entRailTitle}></div>
          <div className="mini-rail72" title={entRailTitle}></div>
          <div className="mini-rail73" title={entRailTitle}></div>
          <div className="mini-rail74" title={entRailTitle}></div>
          <div className="mini-rail75" title={entRailTitle}></div>
          <div className="mini-rail76" title={entRailTitle}></div>
          <div className="mini-rail77" title={entRailTitle}></div>
          <div className="mini-rail78" title={entRailTitle}></div>
        </div>
        <div className="ent-rail-3">
          <div className="mini-rail79" title={entRailTitle}></div>
          <div className="mini-rail80" title={entRailTitle}></div>
          <div className="mini-rail81" title={entRailTitle}></div>
          <div className="mini-rail82" title={entRailTitle}></div>
          <div className="mini-rail83" title={entRailTitle}></div>
          <div className="mini-rail84" title={entRailTitle}></div>
          <div className="mini-rail85" title={entRailTitle}></div>
          <div className="mini-rail86" title={entRailTitle}></div>
          <div className="mini-rail87" title={entRailTitle}></div>
          <div className="mini-rail88" title={entRailTitle}></div>
          <div className="mini-rail89" title={entRailTitle}></div>
          <div className="mini-rail90" title={entRailTitle}></div>
          <div className="mini-rail91" title={entRailTitle}></div>
          <div className="mini-rail92" title={entRailTitle}></div>
          <div className="mini-rail93" title={entRailTitle}></div>
          <div className="mini-rail94" title={entRailTitle}></div>
          <div className="mini-rail95" title={entRailTitle}></div>
          <div className="mini-rail96" title={entRailTitle}></div>
          <div className="mini-rail97" title={entRailTitle}></div>
          <div className="mini-rail98" title={entRailTitle}></div>
          <div className="mini-rail99" title={entRailTitle}></div>
          <div className="mini-rail100" title={entRailTitle}></div>
          <div className="mini-rail101" title={entRailTitle}></div>
          <div className="mini-rail102" title={entRailTitle}></div>
          <div className="mini-rail103" title={entRailTitle}></div>
          <div className="mini-rail104" title={entRailTitle}></div>
          <div className="mini-rail105" title={entRailTitle}></div>
          <div className="mini-rail106" title={entRailTitle}></div>
          <div className="mini-rail107" title={entRailTitle}></div>
          <div className="mini-rail108" title={entRailTitle}></div>
          <div className="mini-rail109" title={entRailTitle}></div>
          <div className="mini-rail110" title={entRailTitle}></div>
          <div className="mini-rail111" title={entRailTitle}></div>
          <div className="mini-rail112" title={entRailTitle}></div>
          <div className="mini-rail113" title={entRailTitle}></div>
          <div className="mini-rail114" title={entRailTitle}></div>
          <div className="mini-rail115" title={entRailTitle}></div>
          <div className="mini-rail116" title={entRailTitle}></div>
          <div className="mini-rail117" title={entRailTitle}></div>
        </div>
        <div className="ent-rail-4">
          <div className="mini-rail118" title={entRailTitle}></div>
          <div className="mini-rail119" title={entRailTitle}></div>
          <div className="mini-rail120" title={entRailTitle}></div>
          <div className="mini-rail121" title={entRailTitle}></div>
          <div className="mini-rail122" title={entRailTitle}></div>
          <div className="mini-rail123" title={entRailTitle}></div>
          <div className="mini-rail124" title={entRailTitle}></div>
          <div className="mini-rail125" title={entRailTitle}></div>
          <div className="mini-rail126" title={entRailTitle}></div>
          <div className="mini-rail127" title={entRailTitle}></div>
          <div className="mini-rail128" title={entRailTitle}></div>
          <div className="mini-rail129" title={entRailTitle}></div>
          <div className="mini-rail130" title={entRailTitle}></div>
          <div className="mini-rail131" title={entRailTitle}></div>
          <div className="mini-rail132" title={entRailTitle}></div>
          <div className="mini-rail133" title={entRailTitle}></div>
          <div className="mini-rail134" title={entRailTitle}></div>
          <div className="mini-rail135" title={entRailTitle}></div>
          <div className="mini-rail136" title={entRailTitle}></div>
          <div className="mini-rail137" title={entRailTitle}></div>
          <div className="mini-rail138" title={entRailTitle}></div>
          <div className="mini-rail139" title={entRailTitle}></div>
          <div className="mini-rail140" title={entRailTitle}></div>
          <div className="mini-rail141" title={entRailTitle}></div>
          <div className="mini-rail142" title={entRailTitle}></div>
          <div className="mini-rail143" title={entRailTitle}></div>
          <div className="mini-rail144" title={entRailTitle}></div>
          <div className="mini-rail145" title={entRailTitle}></div>
          <div className="mini-rail146" title={entRailTitle}></div>
          <div className="mini-rail147" title={entRailTitle}></div>
          <div className="mini-rail148" title={entRailTitle}></div>
          <div className="mini-rail149" title={entRailTitle}></div>
          <div className="mini-rail150" title={entRailTitle}></div>
          <div className="mini-rail151" title={entRailTitle}></div>
          <div className="mini-rail152" title={entRailTitle}></div>
          <div className="mini-rail153" title={entRailTitle}></div>
          <div className="mini-rail154" title={entRailTitle}></div>
          <div className="mini-rail155" title={entRailTitle}></div>
          <div className="mini-rail156" title={entRailTitle}></div>
        </div>
        <div className="ent-rail-5">
          <div className="mini-rail157" title={entRailTitle}></div>
          <div className="mini-rail158" title={entRailTitle}></div>
          <div className="mini-rail159" title={entRailTitle}></div>
          <div className="mini-rail160" title={entRailTitle}></div>
          <div className="mini-rail161" title={entRailTitle}></div>
          <div className="mini-rail162" title={entRailTitle}></div>
          <div className="mini-rail163" title={entRailTitle}></div>
          <div className="mini-rail164" title={entRailTitle}></div>
          <div className="mini-rail165" title={entRailTitle}></div>
          <div className="mini-rail166" title={entRailTitle}></div>
          <div className="mini-rail167" title={entRailTitle}></div>
          <div className="mini-rail168" title={entRailTitle}></div>
          <div className="mini-rail169" title={entRailTitle}></div>
          <div className="mini-rail170" title={entRailTitle}></div>
          <div className="mini-rail171" title={entRailTitle}></div>
          <div className="mini-rail172" title={entRailTitle}></div>
          <div className="mini-rail173" title={entRailTitle}></div>
          <div className="mini-rail174" title={entRailTitle}></div>
          <div className="mini-rail175" title={entRailTitle}></div>
          <div className="mini-rail176" title={entRailTitle}></div>
          <div className="mini-rail177" title={entRailTitle}></div>
          <div className="mini-rail178" title={entRailTitle}></div>
          <div className="mini-rail179" title={entRailTitle}></div>
          <div className="mini-rail180" title={entRailTitle}></div>
          <div className="mini-rail181" title={entRailTitle}></div>
          <div className="mini-rail182" title={entRailTitle}></div>
          <div className="mini-rail183" title={entRailTitle}></div>
          <div className="mini-rail184" title={entRailTitle}></div>
          <div className="mini-rail185" title={entRailTitle}></div>
          <div className="mini-rail186" title={entRailTitle}></div>
          <div className="mini-rail187" title={entRailTitle}></div>
          <div className="mini-rail188" title={entRailTitle}></div>
          <div className="mini-rail189" title={entRailTitle}></div>
          <div className="mini-rail190" title={entRailTitle}></div>
          <div className="mini-rail191" title={entRailTitle}></div>
          <div className="mini-rail192" title={entRailTitle}></div>
          <div className="mini-rail193" title={entRailTitle}></div>
          <div className="mini-rail194" title={entRailTitle}></div>
          <div className="mini-rail195" title={entRailTitle}></div>
        </div>
        <div className="ent-rail-6">
          <div className="mini-rail196" title={entRailTitle}></div>
          <div className="mini-rail197" title={entRailTitle}></div>
          <div className="mini-rail198" title={entRailTitle}></div>
          <div className="mini-rail199" title={entRailTitle}></div>
          <div className="mini-rail200" title={entRailTitle}></div>
          <div className="mini-rail201" title={entRailTitle}></div>
          <div className="mini-rail202" title={entRailTitle}></div>
          <div className="mini-rail203" title={entRailTitle}></div>
          <div className="mini-rail204" title={entRailTitle}></div>
          <div className="mini-rail205" title={entRailTitle}></div>
          <div className="mini-rail206" title={entRailTitle}></div>
          <div className="mini-rail207" title={entRailTitle}></div>
          <div className="mini-rail208" title={entRailTitle}></div>
          <div className="mini-rail209" title={entRailTitle}></div>
          <div className="mini-rail210" title={entRailTitle}></div>
          <div className="mini-rail211" title={entRailTitle}></div>
          <div className="mini-rail212" title={entRailTitle}></div>
          <div className="mini-rail213" title={entRailTitle}></div>
          <div className="mini-rail214" title={entRailTitle}></div>
          <div className="mini-rail215" title={entRailTitle}></div>
          <div className="mini-rail216" title={entRailTitle}></div>
          <div className="mini-rail217" title={entRailTitle}></div>
          <div className="mini-rail218" title={entRailTitle}></div>
          <div className="mini-rail219" title={entRailTitle}></div>
          <div className="mini-rail220" title={entRailTitle}></div>
          <div className="mini-rail221" title={entRailTitle}></div>
          <div className="mini-rail222" title={entRailTitle}></div>
          <div className="mini-rail223" title={entRailTitle}></div>
          <div className="mini-rail224" title={entRailTitle}></div>
          <div className="mini-rail225" title={entRailTitle}></div>
          <div className="mini-rail226" title={entRailTitle}></div>
          <div className="mini-rail227" title={entRailTitle}></div>
          <div className="mini-rail228" title={entRailTitle}></div>
          <div className="mini-rail229" title={entRailTitle}></div>
          <div className="mini-rail230" title={entRailTitle}></div>
          <div className="mini-rail231" title={entRailTitle}></div>
          <div className="mini-rail232" title={entRailTitle}></div>
          <div className="mini-rail233" title={entRailTitle}></div>
          <div className="mini-rail234" title={entRailTitle}></div>
        </div>
        <img className="ent-up-1" src="/scada/drive/arrow-up.svg" title={arrowTitle('entUp')} />
        <img className="ent-down-1" src="/scada/drive/arrow-down.svg" title={arrowTitle('entDown')} />
        <img className="ent-up-2" src="/scada/drive/arrow-up.svg" title={arrowTitle('entUp')} />
        <img className="ent-down-2" src="/scada/drive/arrow-down.svg" title={arrowTitle('entDown')} />
        <img className="ent-up-3" src="/scada/drive/arrow-up.svg" title={arrowTitle('entUp')} />
        <img className="ent-down-3" src="/scada/drive/arrow-down.svg" title={arrowTitle('entDown')} />
        <img className="ent-up-4" src="/scada/drive/arrow-up.svg" title={arrowTitle('entUp')} />
        <img className="ent-down-4" src="/scada/drive/arrow-down.svg" title={arrowTitle('entDown')} />
        <img className="ent-motor-1" src="/scada/drive/motor-h.svg" title={motorTitle('ent-motor-1')} />
        <img className="ent-motor-2" src="/scada/drive/motor-drum.svg" title={motorTitle('ent-motor-2')} />
        <img className="ent-motor-3" src="/scada/drive/motor-v1.svg" title={motorTitle('ent-motor-3')} />
        <img className="ent-motor-4" src="/scada/drive/motor-v2.svg" title={motorTitle('ent-motor-4')} />
        <img className="ent-door-1" src="/scada/drive/ent-door-10.png" title={doorTitle()} />
      </div>
      <div className="main-drive">
        <img className="main-1-zone" src="/scada/drive/main-1-zone0.png" title={zoneTitle('main-1-zone')} />
        <img className="main-2-zone" src="/scada/drive/main-2-zone0.png" title={zoneTitle('main-2-zone')} />
        <img className="main-3-zone" src="/scada/drive/main-3-zone0.png" title={zoneTitle('main-3-zone')} />
        <img className="main-4-zone" src="/scada/drive/main-4-zone0.png" title={zoneTitle('main-4-zone')} />
        <img className="main-5-zone" src="/scada/drive/main-5-zone0.png" title={zoneTitle('main-5-zone')} />
        <img className="main-6-zone" src="/scada/drive/main-6-zone0.png" title={zoneTitle('main-6-zone')} />
        <img className="main-7-zone" src="/scada/drive/main-7-zone0.png" title={zoneTitle('main-7-zone')} />
        <img className="main-obj-2" src="/scada/drive/main-obj-20.png" />
        <img className="main-obj-1" src="/scada/drive/main-obj-10.png" />
        <img className="main-motor-1" src="/scada/drive/motor-v2.svg" title={motorTitle('main-motor-1')} />
        <img className="main-motor-2" src="/scada/drive/motor-v2.svg" title={motorTitle('main-motor-2')} />
      </div>
      <div className="exit-conv">
        <img className="exit-obj-1" src="/scada/drive/exit-obj-10.png" />
        <img className="exit-obj-2" src="/scada/drive/exit-obj-20.png" />
        <img className="exit-obj-3" src="/scada/drive/exit-obj-30.png" />
        <img className="exit-obj-4" src="/scada/drive/exit-obj-40.png" />
        <img className="exit-obj-5" src="/scada/drive/exit-obj-50.png" />
        <img className="exit-obj-6" src="/scada/drive/exit-obj-60.png" />
        <img className="exit-conv-1" src={exitRoller} title={exitRollerTitle} />
        <img className="exit-conv-2" src={exitRoller} title={exitRollerTitle} />
        <img className="exit-conv-3" src={exitRoller} title={exitRollerTitle} />
        <img className="exit-conv-6" src={exitRoller} title={exitRollerTitle} />
        <img className="exit-conv-8" src={exitRoller} title={exitRollerTitle} />
        <img className="exit-conv-9" src={exitRoller} title={exitRollerTitle} />
        <img className="exit-obj-7" src="/scada/drive/exit-obj-70.png" />
        <img className="exit-obj-8" src="/scada/drive/exit-obj-80.png" />
        <img className="exit-obj-9" src="/scada/drive/exit-obj-90.png" />
        <img className="exit-obj-10" src="/scada/drive/exit-obj-100.png" />
        <img className="exit-obj-11" src="/scada/drive/exit-obj-110.png" />
        <img className="exit-obj-12" src="/scada/drive/exit-obj-120.png" />
        <img className="exit-obj-13" src="/scada/drive/exit-obj-130.png" />
        <img className="exit-obj-14" src="/scada/drive/exit-obj-140.png" />
        <img className="exit-obj-15" src="/scada/drive/exit-obj-150.png" />
        <img className="exit-obj-16" src="/scada/drive/exit-obj-160.png" />
        <img className="exit-obj-17" src="/scada/drive/exit-obj-170.png" />
        <img className="exit-obj-18" src="/scada/drive/exit-obj-180.png" />
        <div className="exit-obj-19"></div>
        <div className="exit-obj-20"></div>
        <div className="exit-obj-21"></div>
        <div className="exit-obj-22"></div>
        <div className="exit-obj-23"></div>
        <div className="exit-obj-24"></div>
        <div className="exit-rail-1">
          <div className="mini-rail235" title={exitRailTitle}></div>
          <div className="mini-rail236" title={exitRailTitle}></div>
          <div className="mini-rail237" title={exitRailTitle}></div>
          <div className="mini-rail238" title={exitRailTitle}></div>
          <div className="mini-rail239" title={exitRailTitle}></div>
          <div className="mini-rail240" title={exitRailTitle}></div>
          <div className="mini-rail241" title={exitRailTitle}></div>
          <div className="mini-rail242" title={exitRailTitle}></div>
          <div className="mini-rail243" title={exitRailTitle}></div>
          <div className="mini-rail244" title={exitRailTitle}></div>
          <div className="mini-rail245" title={exitRailTitle}></div>
          <div className="mini-rail246" title={exitRailTitle}></div>
          <div className="mini-rail247" title={exitRailTitle}></div>
          <div className="mini-rail248" title={exitRailTitle}></div>
          <div className="mini-rail249" title={exitRailTitle}></div>
          <div className="mini-rail250" title={exitRailTitle}></div>
          <div className="mini-rail251" title={exitRailTitle}></div>
          <div className="mini-rail252" title={exitRailTitle}></div>
          <div className="mini-rail253" title={exitRailTitle}></div>
          <div className="mini-rail254" title={exitRailTitle}></div>
          <div className="mini-rail255" title={exitRailTitle}></div>
          <div className="mini-rail256" title={exitRailTitle}></div>
          <div className="mini-rail257" title={exitRailTitle}></div>
          <div className="mini-rail258" title={exitRailTitle}></div>
          <div className="mini-rail259" title={exitRailTitle}></div>
          <div className="mini-rail260" title={exitRailTitle}></div>
          <div className="mini-rail261" title={exitRailTitle}></div>
          <div className="mini-rail262" title={exitRailTitle}></div>
          <div className="mini-rail263" title={exitRailTitle}></div>
          <div className="mini-rail264" title={exitRailTitle}></div>
          <div className="mini-rail265" title={exitRailTitle}></div>
          <div className="mini-rail266" title={exitRailTitle}></div>
          <div className="mini-rail267" title={exitRailTitle}></div>
          <div className="mini-rail268" title={exitRailTitle}></div>
          <div className="mini-rail269" title={exitRailTitle}></div>
          <div className="mini-rail270" title={exitRailTitle}></div>
          <div className="mini-rail271" title={exitRailTitle}></div>
          <div className="mini-rail272" title={exitRailTitle}></div>
          <div className="mini-rail273" title={exitRailTitle}></div>
        </div>
        <div className="exit-rail-2">
          <div className="mini-rail274" title={exitRailTitle}></div>
          <div className="mini-rail275" title={exitRailTitle}></div>
          <div className="mini-rail276" title={exitRailTitle}></div>
          <div className="mini-rail277" title={exitRailTitle}></div>
          <div className="mini-rail278" title={exitRailTitle}></div>
          <div className="mini-rail279" title={exitRailTitle}></div>
          <div className="mini-rail280" title={exitRailTitle}></div>
          <div className="mini-rail281" title={exitRailTitle}></div>
          <div className="mini-rail282" title={exitRailTitle}></div>
          <div className="mini-rail283" title={exitRailTitle}></div>
          <div className="mini-rail284" title={exitRailTitle}></div>
          <div className="mini-rail285" title={exitRailTitle}></div>
          <div className="mini-rail286" title={exitRailTitle}></div>
          <div className="mini-rail287" title={exitRailTitle}></div>
          <div className="mini-rail288" title={exitRailTitle}></div>
          <div className="mini-rail289" title={exitRailTitle}></div>
          <div className="mini-rail290" title={exitRailTitle}></div>
          <div className="mini-rail291" title={exitRailTitle}></div>
          <div className="mini-rail292" title={exitRailTitle}></div>
          <div className="mini-rail293" title={exitRailTitle}></div>
          <div className="mini-rail294" title={exitRailTitle}></div>
          <div className="mini-rail295" title={exitRailTitle}></div>
          <div className="mini-rail296" title={exitRailTitle}></div>
          <div className="mini-rail297" title={exitRailTitle}></div>
          <div className="mini-rail298" title={exitRailTitle}></div>
          <div className="mini-rail299" title={exitRailTitle}></div>
          <div className="mini-rail300" title={exitRailTitle}></div>
          <div className="mini-rail301" title={exitRailTitle}></div>
          <div className="mini-rail302" title={exitRailTitle}></div>
          <div className="mini-rail303" title={exitRailTitle}></div>
          <div className="mini-rail304" title={exitRailTitle}></div>
          <div className="mini-rail305" title={exitRailTitle}></div>
          <div className="mini-rail306" title={exitRailTitle}></div>
          <div className="mini-rail307" title={exitRailTitle}></div>
          <div className="mini-rail308" title={exitRailTitle}></div>
          <div className="mini-rail309" title={exitRailTitle}></div>
          <div className="mini-rail310" title={exitRailTitle}></div>
          <div className="mini-rail311" title={exitRailTitle}></div>
          <div className="mini-rail312" title={exitRailTitle}></div>
        </div>
        <div className="exit-rail-3">
          <div className="mini-rail313" title={exitRailTitle}></div>
          <div className="mini-rail314" title={exitRailTitle}></div>
          <div className="mini-rail315" title={exitRailTitle}></div>
          <div className="mini-rail316" title={exitRailTitle}></div>
          <div className="mini-rail317" title={exitRailTitle}></div>
          <div className="mini-rail318" title={exitRailTitle}></div>
          <div className="mini-rail319" title={exitRailTitle}></div>
          <div className="mini-rail320" title={exitRailTitle}></div>
          <div className="mini-rail321" title={exitRailTitle}></div>
          <div className="mini-rail322" title={exitRailTitle}></div>
          <div className="mini-rail323" title={exitRailTitle}></div>
          <div className="mini-rail324" title={exitRailTitle}></div>
          <div className="mini-rail325" title={exitRailTitle}></div>
          <div className="mini-rail326" title={exitRailTitle}></div>
          <div className="mini-rail327" title={exitRailTitle}></div>
          <div className="mini-rail328" title={exitRailTitle}></div>
          <div className="mini-rail329" title={exitRailTitle}></div>
          <div className="mini-rail330" title={exitRailTitle}></div>
          <div className="mini-rail331" title={exitRailTitle}></div>
          <div className="mini-rail332" title={exitRailTitle}></div>
          <div className="mini-rail333" title={exitRailTitle}></div>
          <div className="mini-rail334" title={exitRailTitle}></div>
          <div className="mini-rail335" title={exitRailTitle}></div>
          <div className="mini-rail336" title={exitRailTitle}></div>
          <div className="mini-rail337" title={exitRailTitle}></div>
          <div className="mini-rail338" title={exitRailTitle}></div>
          <div className="mini-rail339" title={exitRailTitle}></div>
          <div className="mini-rail340" title={exitRailTitle}></div>
          <div className="mini-rail341" title={exitRailTitle}></div>
          <div className="mini-rail342" title={exitRailTitle}></div>
          <div className="mini-rail343" title={exitRailTitle}></div>
          <div className="mini-rail344" title={exitRailTitle}></div>
          <div className="mini-rail345" title={exitRailTitle}></div>
          <div className="mini-rail346" title={exitRailTitle}></div>
          <div className="mini-rail347" title={exitRailTitle}></div>
          <div className="mini-rail348" title={exitRailTitle}></div>
          <div className="mini-rail349" title={exitRailTitle}></div>
          <div className="mini-rail350" title={exitRailTitle}></div>
          <div className="mini-rail351" title={exitRailTitle}></div>
        </div>
        <div className="exit-rail-4">
          <div className="mini-rail352" title={exitRailTitle}></div>
          <div className="mini-rail353" title={exitRailTitle}></div>
          <div className="mini-rail354" title={exitRailTitle}></div>
          <div className="mini-rail355" title={exitRailTitle}></div>
          <div className="mini-rail356" title={exitRailTitle}></div>
          <div className="mini-rail357" title={exitRailTitle}></div>
          <div className="mini-rail358" title={exitRailTitle}></div>
          <div className="mini-rail359" title={exitRailTitle}></div>
          <div className="mini-rail360" title={exitRailTitle}></div>
          <div className="mini-rail361" title={exitRailTitle}></div>
          <div className="mini-rail362" title={exitRailTitle}></div>
          <div className="mini-rail363" title={exitRailTitle}></div>
          <div className="mini-rail364" title={exitRailTitle}></div>
          <div className="mini-rail365" title={exitRailTitle}></div>
          <div className="mini-rail366" title={exitRailTitle}></div>
          <div className="mini-rail367" title={exitRailTitle}></div>
          <div className="mini-rail368" title={exitRailTitle}></div>
          <div className="mini-rail369" title={exitRailTitle}></div>
          <div className="mini-rail370" title={exitRailTitle}></div>
          <div className="mini-rail371" title={exitRailTitle}></div>
          <div className="mini-rail372" title={exitRailTitle}></div>
          <div className="mini-rail373" title={exitRailTitle}></div>
          <div className="mini-rail374" title={exitRailTitle}></div>
          <div className="mini-rail375" title={exitRailTitle}></div>
          <div className="mini-rail376" title={exitRailTitle}></div>
          <div className="mini-rail377" title={exitRailTitle}></div>
          <div className="mini-rail378" title={exitRailTitle}></div>
          <div className="mini-rail379" title={exitRailTitle}></div>
          <div className="mini-rail380" title={exitRailTitle}></div>
          <div className="mini-rail381" title={exitRailTitle}></div>
          <div className="mini-rail382" title={exitRailTitle}></div>
          <div className="mini-rail383" title={exitRailTitle}></div>
          <div className="mini-rail384" title={exitRailTitle}></div>
          <div className="mini-rail385" title={exitRailTitle}></div>
          <div className="mini-rail386" title={exitRailTitle}></div>
          <div className="mini-rail387" title={exitRailTitle}></div>
          <div className="mini-rail388" title={exitRailTitle}></div>
          <div className="mini-rail389" title={exitRailTitle}></div>
          <div className="mini-rail390" title={exitRailTitle}></div>
        </div>
        <div className="exit-rail-5">
          <div className="mini-rail391" title={exitRailTitle}></div>
          <div className="mini-rail392" title={exitRailTitle}></div>
          <div className="mini-rail393" title={exitRailTitle}></div>
          <div className="mini-rail394" title={exitRailTitle}></div>
          <div className="mini-rail395" title={exitRailTitle}></div>
          <div className="mini-rail396" title={exitRailTitle}></div>
          <div className="mini-rail397" title={exitRailTitle}></div>
          <div className="mini-rail398" title={exitRailTitle}></div>
          <div className="mini-rail399" title={exitRailTitle}></div>
          <div className="mini-rail400" title={exitRailTitle}></div>
          <div className="mini-rail401" title={exitRailTitle}></div>
          <div className="mini-rail402" title={exitRailTitle}></div>
          <div className="mini-rail403" title={exitRailTitle}></div>
          <div className="mini-rail404" title={exitRailTitle}></div>
          <div className="mini-rail405" title={exitRailTitle}></div>
          <div className="mini-rail406" title={exitRailTitle}></div>
          <div className="mini-rail407" title={exitRailTitle}></div>
          <div className="mini-rail408" title={exitRailTitle}></div>
          <div className="mini-rail409" title={exitRailTitle}></div>
          <div className="mini-rail410" title={exitRailTitle}></div>
          <div className="mini-rail411" title={exitRailTitle}></div>
          <div className="mini-rail412" title={exitRailTitle}></div>
          <div className="mini-rail413" title={exitRailTitle}></div>
          <div className="mini-rail414" title={exitRailTitle}></div>
          <div className="mini-rail415" title={exitRailTitle}></div>
          <div className="mini-rail416" title={exitRailTitle}></div>
          <div className="mini-rail417" title={exitRailTitle}></div>
          <div className="mini-rail418" title={exitRailTitle}></div>
          <div className="mini-rail419" title={exitRailTitle}></div>
          <div className="mini-rail420" title={exitRailTitle}></div>
          <div className="mini-rail421" title={exitRailTitle}></div>
          <div className="mini-rail422" title={exitRailTitle}></div>
          <div className="mini-rail423" title={exitRailTitle}></div>
          <div className="mini-rail424" title={exitRailTitle}></div>
          <div className="mini-rail425" title={exitRailTitle}></div>
          <div className="mini-rail426" title={exitRailTitle}></div>
          <div className="mini-rail427" title={exitRailTitle}></div>
          <div className="mini-rail428" title={exitRailTitle}></div>
          <div className="mini-rail429" title={exitRailTitle}></div>
        </div>
        <div className="exit-rail-6">
          <div className="mini-rail430" title={exitRailTitle}></div>
          <div className="mini-rail431" title={exitRailTitle}></div>
          <div className="mini-rail432" title={exitRailTitle}></div>
          <div className="mini-rail433" title={exitRailTitle}></div>
          <div className="mini-rail434" title={exitRailTitle}></div>
          <div className="mini-rail435" title={exitRailTitle}></div>
          <div className="mini-rail436" title={exitRailTitle}></div>
          <div className="mini-rail437" title={exitRailTitle}></div>
          <div className="mini-rail438" title={exitRailTitle}></div>
          <div className="mini-rail439" title={exitRailTitle}></div>
          <div className="mini-rail440" title={exitRailTitle}></div>
          <div className="mini-rail441" title={exitRailTitle}></div>
          <div className="mini-rail442" title={exitRailTitle}></div>
          <div className="mini-rail443" title={exitRailTitle}></div>
          <div className="mini-rail444" title={exitRailTitle}></div>
          <div className="mini-rail445" title={exitRailTitle}></div>
          <div className="mini-rail446" title={exitRailTitle}></div>
          <div className="mini-rail447" title={exitRailTitle}></div>
          <div className="mini-rail448" title={exitRailTitle}></div>
          <div className="mini-rail449" title={exitRailTitle}></div>
          <div className="mini-rail450" title={exitRailTitle}></div>
          <div className="mini-rail451" title={exitRailTitle}></div>
          <div className="mini-rail452" title={exitRailTitle}></div>
          <div className="mini-rail453" title={exitRailTitle}></div>
          <div className="mini-rail454" title={exitRailTitle}></div>
          <div className="mini-rail455" title={exitRailTitle}></div>
          <div className="mini-rail456" title={exitRailTitle}></div>
          <div className="mini-rail457" title={exitRailTitle}></div>
          <div className="mini-rail458" title={exitRailTitle}></div>
          <div className="mini-rail459" title={exitRailTitle}></div>
          <div className="mini-rail460" title={exitRailTitle}></div>
          <div className="mini-rail461" title={exitRailTitle}></div>
          <div className="mini-rail462" title={exitRailTitle}></div>
          <div className="mini-rail463" title={exitRailTitle}></div>
          <div className="mini-rail464" title={exitRailTitle}></div>
          <div className="mini-rail465" title={exitRailTitle}></div>
          <div className="mini-rail466" title={exitRailTitle}></div>
          <div className="mini-rail467" title={exitRailTitle}></div>
          <div className="mini-rail468" title={exitRailTitle}></div>
        </div>
        <img className="exit-up-1" src="/scada/drive/arrow-up.svg" title={arrowTitle('exitUp')} />
        <img className="exit-down-1" src="/scada/drive/arrow-down.svg" title={arrowTitle('exitDown')} />
        <img className="exit-up-2" src="/scada/drive/arrow-up.svg" title={arrowTitle('exitUp')} />
        <img className="exit-down-2" src="/scada/drive/arrow-down.svg" title={arrowTitle('exitDown')} />
        <img className="exit-up-3" src="/scada/drive/arrow-up.svg" title={arrowTitle('exitUp')} />
        <img className="exit-down-3" src="/scada/drive/arrow-down.svg" title={arrowTitle('exitDown')} />
        <img className="exit-up-4" src="/scada/drive/arrow-up.svg" title={arrowTitle('exitUp')} />
        <img className="exit-down-4" src="/scada/drive/arrow-down.svg" title={arrowTitle('exitDown')} />
        <img className="exit-motor-1" src="/scada/drive/motor-h.svg" title={motorTitle('exit-motor-1')} />
        <img className="exit-motor-2" src="/scada/drive/motor-h.svg" title={motorTitle('exit-motor-2')} />
        <img className="exit-motor-3" src="/scada/drive/motor-drum.svg" title={motorTitle('exit-motor-3')} />
        <img className="exit-motor-4" src="/scada/drive/motor-h.svg" title={motorTitle('exit-motor-4')} />
        <img className="exit-motor-5" src="/scada/drive/motor-v2.svg" title={motorTitle('exit-motor-5')} />
      </div>
    </div>
  );
}

/* memo — 이 컴포넌트는 값을 받지 않는 고정 그림이다. 감싸는 화면이 1초마다 폴링 값으로
   다시 그려지는데, memo가 없으면 그때마다 이 안의 수백 개 요소(구동 571 / 연소 328)까지
   같이 비교된다. props가 없으니 memo는 "두 번 다시 그리지 않는다"와 같다. */
export default memo(DriveOverview);
