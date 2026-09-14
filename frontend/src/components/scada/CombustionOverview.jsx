/* ===========================================================================
   연소화면 설비 그림 — 작화 도구가 뽑아준 index.html을 그대로 옮긴 것.

   클래스 이름은 작화 style.css(= pages/scada/combustionOverview.css)와 1:1로 묶여
   있어서 하나도 바꾸면 안 된다. 바꾼 것은 세 가지다.
     - class=      → className=      (JSX 문법)
     - src="A.png" → src="/scada/combustion/A.png"  (public 폴더로 옮겨서 경로가 생김)
     - 배관 부속 4개(gas-pre0 / gas-sol0 / blower-pre0 / blower-pump0)를 .png → .svg
     - 존 밸브 42개(obj0~obj41.png)를 obj-valve-small.svg / obj-valve-wide.svg 로 교체
     - 존 가스 밸브 28개(*-zone-valve-*.png)를 zone-valve.svg 로 교체
     - 존 불꽃 28개(*-fire-*.png)를 zone-fire.svg 로 교체

   뒤 네 가지는 같은 이유다. 이 화면은 그림을 창 크기에 맞춰 늘려 그리는데
   (useStageStretch, 가로·세로 배율이 따로 논다), 원본이 작은 PNG면 늘릴 때
   흐려지고 찌그러진다. 그래서 같은 실루엣으로 SVG를 다시 그려 끼웠다.

   밸브가 42개지만 SVG는 2개뿐인 이유:
     - 파일은 42개인데 실제 그림은 4종이었다(작은 것/넓은 것 x 상단/하단).
     - 상단과 하단은 같은 기기이고, 하단은 작화 CSS가 rotate(-180deg)로 돌려 쓴다.
       작은 것은 위아래 대칭이고, 넓은 것은 4분할 색이 대각선 대칭이라 돌려도 배색이
       그대로다. 그래서 상·하단이 같은 파일 하나를 쓰면 된다.

   각 SVG의 viewBox는 원본의 '내용 영역'으로 잡아 두었다. 칸(19x22 / 39x28)에 넣었을 때
   여백 없이 꽉 차면서 비율이 맞는다. 하단 존은 예전에 여백이 있는 큰 PNG를 쓰고 있어
   밸브가 상단보다 조금 작게 나왔는데, 이제 상·하단 크기가 같아진다.

   존 가스 밸브 28개가 SVG 1개인 이유도 같다. 원본은 3종(27x22 두 개 + 50x41 한 개)인데
   셋 다 같은 그림(구동부 돔이 왼쪽)이고, 자리마다 방향이 다른 것은 작화 CSS가
   뒤집어 주기 때문이다. 그래서 파일 하나를 28곳에 그대로 끼워도 방향이 유지된다.
     for-*-valve-1  변형 없음        for-*-valve-2  scale(-1, 1)
     rev-*-valve-1  rotate(-180deg)  rev-*-valve-2  scale(1, -1)

   불꽃 28개도 마찬가지다. 원본 2종이 같은 그림(불꽃이 위로)이고 아래 존만 CSS가
   rotate(-180deg)로 돌린다. 다만 불꽃은 원본이 손으로 찍은 픽셀이라 좌우가
   울퉁불퉁했는데, 7개가 나란히 서는 자리라 좌우 대칭으로 펴서 그렸다.

   원본 PNG는 public 폴더에 다 그대로 두었다. 되돌리려면 src를 원래 파일명으로
   바꾸면 된다 — 작은 것 obj0/2/3/5/6/8/9/11/12/14/15/17/18/20(상단)과
   obj21/23/24/26/27/29/30/32/33/35/36/38/39/41(하단),
   넓은 것 obj1/4/7/10/13/16/19(상단)과 obj22/25/28/31/34/37/40(하단),
   존 가스 밸브는 for-N-zone-valve-10/20.png 와 rev-N-zone-valve-10/20.png.
   =========================================================================== */

export default function CombustionOverview() {
  return (
    <div className="combustion">
      <div className="pipe-group-1">
        <div className="pipe"></div>
        <div className="pipe2"></div>
        <div className="pipe3"></div>
        <div className="pipe4"></div>
        <div className="pipe5"></div>
        <div className="pipe6"></div>
        <div className="pipe7"></div>
        <div className="pipe8"></div>
        <div className="pipe9"></div>
        <div className="pipe10"></div>
        <div className="pipe11"></div>
        <div className="pipe12"></div>
        <div className="pipe13"></div>
        <div className="pipe14"></div>
        <div className="pipe15"></div>
        <div className="pipe16"></div>
        <div className="pipe17"></div>
        <div className="pipe18"></div>
        <div className="pipe19"></div>
        <div className="pipe20"></div>
        <div className="pipe21"></div>
        <div className="pipe22"></div>
        <div className="pipe23"></div>
        <div className="pipe24"></div>
        <div className="pipe25"></div>
        <div className="pipe26"></div>
        <div className="pipe27"></div>
        <div className="pipe28"></div>
        <div className="pipe29"></div>
        <div className="pipe30"></div>
        <div className="pipe31"></div>
        <div className="pipe32"></div>
        <div className="pipe33"></div>
        <div className="pipe34"></div>
        <div className="pipe35"></div>
        <div className="pipe36"></div>
      </div>
      <div className="pipe-group-2">
        <div className="pipe-6"></div>
        <div className="pipe37"></div>
        <div className="pipe38"></div>
        <div className="pipe39"></div>
        <div className="pipe40"></div>
        <div className="pipe41"></div>
        <div className="pipe42"></div>
        <div className="pipe43"></div>
        <div className="pipe44"></div>
        <div className="pipe45"></div>
        <div className="pipe46"></div>
        <div className="pipe47"></div>
        <div className="pipe48"></div>
        <div className="pipe49"></div>
        <div className="pipe50"></div>
        <div className="pipe51"></div>
        <div className="pipe52"></div>
        <div className="pipe53"></div>
        <div className="pipe54"></div>
        <div className="pipe55"></div>
        <div className="pipe56"></div>
        <div className="pipe57"></div>
        <div className="pipe58"></div>
        <div className="pipe59"></div>
        <div className="pipe60"></div>
        <div className="pipe61"></div>
        <div className="pipe62"></div>
        <div className="pipe63"></div>
        <div className="pipe64"></div>
      </div>
      <div className="pipe-group-3">
        <div className="pipe65"></div>
        <div className="pipe66"></div>
        <div className="pipe67"></div>
        <div className="pipe68"></div>
        <div className="pipe69"></div>
        <div className="pipe70"></div>
        <div className="pipe71"></div>
        <div className="pipe72"></div>
        <div className="pipe73"></div>
        <div className="pipe74"></div>
        <div className="pipe75"></div>
        <div className="pipe76"></div>
        <div className="pipe77"></div>
        <div className="pipe78"></div>
        <div className="pipe79"></div>
        <div className="pipe80"></div>
        <div className="pipe81"></div>
        <div className="pipe82"></div>
        <div className="pipe83"></div>
        <div className="pipe84"></div>
        <div className="pipe85"></div>
        <div className="pipe86"></div>
        <div className="pipe87"></div>
        <div className="pipe88"></div>
        <div className="pipe89"></div>
        <div className="pipe90"></div>
        <div className="pipe91"></div>
        <div className="pipe92"></div>
        <div className="pipe93"></div>
        <div className="pipe94"></div>
        <div className="pipe95"></div>
        <div className="pipe96"></div>
        <div className="pipe97"></div>
        <div className="pipe98"></div>
        <div className="pipe99"></div>
        <div className="pipe100"></div>
      </div>
      <div className="pipe-group-4">
        <div className="pipe-62"></div>
        <div className="pipe101"></div>
        <div className="pipe102"></div>
        <div className="pipe103"></div>
        <div className="pipe104"></div>
        <div className="pipe105"></div>
        <div className="pipe106"></div>
        <div className="pipe107"></div>
        <div className="pipe108"></div>
        <div className="pipe109"></div>
        <div className="pipe110"></div>
        <div className="pipe111"></div>
        <div className="pipe112"></div>
        <div className="pipe113"></div>
        <div className="pipe114"></div>
        <div className="pipe115"></div>
        <div className="pipe116"></div>
        <div className="pipe117"></div>
        <div className="pipe118"></div>
        <div className="pipe119"></div>
        <div className="pipe120"></div>
        <div className="pipe121"></div>
        <div className="pipe122"></div>
        <div className="pipe123"></div>
        <div className="pipe124"></div>
        <div className="pipe125"></div>
        <div className="pipe126"></div>
        <div className="pipe127"></div>
        <div className="pipe128"></div>
      </div>
      <div className="main-gas">
        <img className="main-gas2" src="/scada/combustion/main-gas1.png" />
        <div className="pipe129"></div>
        <div className="pipe130"></div>
        <div className="pipe131"></div>
        <div className="pipe132"></div>
        <img className="gas-pre" src="/scada/combustion/gas-pre0.svg" />
        <img className="gas-sol" src="/scada/combustion/gas-sol0.svg" />
      </div>
      <div className="main-blower">
        <img className="main-blower2" src="/scada/combustion/main-blower1.png" />
        <div className="pipe133"></div>
        <div className="pipe134"></div>
        <div className="pipe135"></div>
        <div className="pipe136"></div>
        <img className="blower-pre" src="/scada/combustion/blower-pre0.svg" />
        <img className="blower-pump" src="/scada/combustion/blower-pump0.svg" />
      </div>
      <div className="zon-box-1"></div>
      <div className="zon-box-2"></div>
      <div className="for-1-zone-obj">
        <div className="for-1-zone-box"></div>
        <div className="pipe137"></div>
        <div className="pipe138"></div>
        <img className="obj" src="/scada/combustion/obj-valve-small.svg" />
        <img className="obj2" src="/scada/combustion/obj-valve-wide.svg" />
        <img className="obj3" src="/scada/combustion/obj-valve-small.svg" />
        <div className="for-1-zone-per"></div>
        <img className="for-1-zone-valve-1" src="/scada/combustion/zone-valve.svg" />
        <img className="for-1-zone-valve-2" src="/scada/combustion/zone-valve.svg" />
      </div>
      <div className="for-2-zone-obj">
        <div className="for-2-zone-box"></div>
        <div className="pipe139"></div>
        <div className="pipe140"></div>
        <img className="obj4" src="/scada/combustion/obj-valve-small.svg" />
        <img className="obj5" src="/scada/combustion/obj-valve-wide.svg" />
        <img className="obj6" src="/scada/combustion/obj-valve-small.svg" />
        <div className="for-2-zone-per"></div>
        <img className="for-2-zone-valve-1" src="/scada/combustion/zone-valve.svg" />
        <img className="for-2-zone-valve-2" src="/scada/combustion/zone-valve.svg" />
      </div>
      <div className="for-3-zone-obj">
        <div className="for-3-zone-box"></div>
        <div className="pipe141"></div>
        <div className="pipe142"></div>
        <img className="obj7" src="/scada/combustion/obj-valve-small.svg" />
        <img className="obj8" src="/scada/combustion/obj-valve-wide.svg" />
        <img className="obj9" src="/scada/combustion/obj-valve-small.svg" />
        <div className="for-3-zone-per"></div>
        <img className="for-3-zone-valve-1" src="/scada/combustion/zone-valve.svg" />
        <img className="for-3-zone-valve-2" src="/scada/combustion/zone-valve.svg" />
      </div>
      <div className="for-4-zone-obj">
        <div className="for-4-zone-box"></div>
        <div className="pipe143"></div>
        <div className="pipe144"></div>
        <img className="obj10" src="/scada/combustion/obj-valve-small.svg" />
        <img className="obj11" src="/scada/combustion/obj-valve-wide.svg" />
        <img className="obj12" src="/scada/combustion/obj-valve-small.svg" />
        <div className="for-4-zone-per"></div>
        <img className="for-4-zone-valve-1" src="/scada/combustion/zone-valve.svg" />
        <img className="for-4-zone-valve-2" src="/scada/combustion/zone-valve.svg" />
      </div>
      <div className="for-5-zone-obj">
        <div className="for-5-zone-box"></div>
        <div className="pipe145"></div>
        <div className="pipe146"></div>
        <img className="obj13" src="/scada/combustion/obj-valve-small.svg" />
        <img className="obj14" src="/scada/combustion/obj-valve-wide.svg" />
        <img className="obj15" src="/scada/combustion/obj-valve-small.svg" />
        <div className="for-5-zone-per"></div>
        <img className="for-5-zone-valve-1" src="/scada/combustion/zone-valve.svg" />
        <img className="for-5-zone-valve-2" src="/scada/combustion/zone-valve.svg" />
      </div>
      <div className="for-6-zone-obj">
        <div className="for-6-zone-box"></div>
        <div className="pipe147"></div>
        <div className="pipe148"></div>
        <img className="obj16" src="/scada/combustion/obj-valve-small.svg" />
        <img className="obj17" src="/scada/combustion/obj-valve-wide.svg" />
        <img className="obj18" src="/scada/combustion/obj-valve-small.svg" />
        <div className="for-6-zone-per"></div>
        <img className="for-6-zone-valve-1" src="/scada/combustion/zone-valve.svg" />
        <img className="for-6-zone-valve-2" src="/scada/combustion/zone-valve.svg" />
      </div>
      <div className="for-7-zone-obj">
        <div className="for-7-zone-box"></div>
        <div className="pipe149"></div>
        <div className="pipe150"></div>
        <img className="obj19" src="/scada/combustion/obj-valve-small.svg" />
        <img className="obj20" src="/scada/combustion/obj-valve-wide.svg" />
        <img className="obj21" src="/scada/combustion/obj-valve-small.svg" />
        <div className="for-7-zone-per"></div>
        <img className="for-7-zone-valve-1" src="/scada/combustion/zone-valve.svg" />
        <img className="for-7-zone-valve-2" src="/scada/combustion/zone-valve.svg" />
      </div>
      <div className="for-fire-group">
        <img className="for-thun-1" src="/scada/combustion/for-thun-10.png" />
        <img className="for-fire-1" src="/scada/combustion/zone-fire.svg" />
        <img className="for-thun-2" src="/scada/combustion/for-thun-20.png" />
        <img className="for-fire-2" src="/scada/combustion/zone-fire.svg" />
        <img className="for-thun-3" src="/scada/combustion/for-thun-30.png" />
        <img className="for-fire-3" src="/scada/combustion/zone-fire.svg" />
        <img className="for-thun-4" src="/scada/combustion/for-thun-40.png" />
        <img className="for-fire-4" src="/scada/combustion/zone-fire.svg" />
        <img className="for-thun-5" src="/scada/combustion/for-thun-50.png" />
        <img className="for-fire-5" src="/scada/combustion/zone-fire.svg" />
        <img className="for-thun-6" src="/scada/combustion/for-thun-60.png" />
        <img className="for-fire-6" src="/scada/combustion/zone-fire.svg" />
        <img className="for-thun-7" src="/scada/combustion/for-thun-70.png" />
        <img className="for-fire-7" src="/scada/combustion/zone-fire.svg" />
        <img className="for-thun-8" src="/scada/combustion/for-thun-80.png" />
        <img className="for-fire-8" src="/scada/combustion/zone-fire.svg" />
        <img className="for-thun-9" src="/scada/combustion/for-thun-90.png" />
        <img className="for-fire-9" src="/scada/combustion/zone-fire.svg" />
        <img className="for-thun-10" src="/scada/combustion/for-thun-100.png" />
        <img className="for-fire-10" src="/scada/combustion/zone-fire.svg" />
        <img className="for-thun-11" src="/scada/combustion/for-thun-110.png" />
        <img className="for-fire-11" src="/scada/combustion/zone-fire.svg" />
        <img className="for-thun-12" src="/scada/combustion/for-thun-120.png" />
        <img className="for-fire-12" src="/scada/combustion/zone-fire.svg" />
        <img className="for-thun-13" src="/scada/combustion/for-thun-130.png" />
        <img className="for-fire-13" src="/scada/combustion/zone-fire.svg" />
        <img className="for-thun-14" src="/scada/combustion/for-thun-140.png" />
        <img className="for-fire-14" src="/scada/combustion/zone-fire.svg" />
      </div>
      <div className="rev-1-zone-obj">
        <div className="rev-1-zone-box"></div>
        <div className="pipe151"></div>
        <div className="pipe152"></div>
        <img className="obj22" src="/scada/combustion/obj-valve-small.svg" />
        <img className="obj23" src="/scada/combustion/obj-valve-wide.svg" />
        <img className="obj24" src="/scada/combustion/obj-valve-small.svg" />
        <div className="rev-1-zone-per"></div>
        <img className="rev-1-zone-valve-1" src="/scada/combustion/zone-valve.svg" />
        <img className="rev-1-zone-valve-2" src="/scada/combustion/zone-valve.svg" />
      </div>
      <div className="rev-2-zone-obj">
        <div className="rev-2-zone-box"></div>
        <div className="pipe153"></div>
        <div className="pipe154"></div>
        <img className="obj25" src="/scada/combustion/obj-valve-small.svg" />
        <img className="obj26" src="/scada/combustion/obj-valve-wide.svg" />
        <img className="obj27" src="/scada/combustion/obj-valve-small.svg" />
        <div className="rev-2-zone-per"></div>
        <img className="rev-2-zone-valve-1" src="/scada/combustion/zone-valve.svg" />
        <img className="rev-2-zone-valve-2" src="/scada/combustion/zone-valve.svg" />
      </div>
      <div className="rev-3-zone-obj">
        <div className="rev-3-zone-box"></div>
        <div className="pipe155"></div>
        <div className="pipe156"></div>
        <img className="obj28" src="/scada/combustion/obj-valve-small.svg" />
        <img className="obj29" src="/scada/combustion/obj-valve-wide.svg" />
        <img className="obj30" src="/scada/combustion/obj-valve-small.svg" />
        <div className="rev-3-zone-per"></div>
        <img className="rev-3-zone-valve-1" src="/scada/combustion/zone-valve.svg" />
        <img className="rev-3-zone-valve-2" src="/scada/combustion/zone-valve.svg" />
      </div>
      <div className="rev-4-zone-obj">
        <div className="rev-4-zone-box"></div>
        <div className="pipe157"></div>
        <div className="pipe158"></div>
        <img className="obj31" src="/scada/combustion/obj-valve-small.svg" />
        <img className="obj32" src="/scada/combustion/obj-valve-wide.svg" />
        <img className="obj33" src="/scada/combustion/obj-valve-small.svg" />
        <div className="rev-4-zone-per"></div>
        <img className="rev-4-zone-valve-1" src="/scada/combustion/zone-valve.svg" />
        <img className="rev-4-zone-valve-2" src="/scada/combustion/zone-valve.svg" />
      </div>
      <div className="rev-5-zone-obj">
        <div className="rev-5-zone-box"></div>
        <div className="pipe159"></div>
        <div className="pipe160"></div>
        <img className="obj34" src="/scada/combustion/obj-valve-small.svg" />
        <img className="obj35" src="/scada/combustion/obj-valve-wide.svg" />
        <img className="obj36" src="/scada/combustion/obj-valve-small.svg" />
        <div className="rev-5-zone-per"></div>
        <img className="rev-5-zone-valve-1" src="/scada/combustion/zone-valve.svg" />
        <img className="rev-5-zone-valve-2" src="/scada/combustion/zone-valve.svg" />
      </div>
      <div className="rev-6-zone-obj">
        <div className="rev-6-zone-box"></div>
        <div className="pipe161"></div>
        <div className="pipe162"></div>
        <img className="obj37" src="/scada/combustion/obj-valve-small.svg" />
        <img className="obj38" src="/scada/combustion/obj-valve-wide.svg" />
        <img className="obj39" src="/scada/combustion/obj-valve-small.svg" />
        <div className="rev-6-zone-per"></div>
        <img className="rev-6-zone-valve-1" src="/scada/combustion/zone-valve.svg" />
        <img className="rev-6-zone-valve-2" src="/scada/combustion/zone-valve.svg" />
      </div>
      <div className="rev-7-zone-obj">
        <div className="rev-7-zone-box"></div>
        <div className="pipe163"></div>
        <div className="pipe164"></div>
        <img className="obj40" src="/scada/combustion/obj-valve-small.svg" />
        <img className="obj41" src="/scada/combustion/obj-valve-wide.svg" />
        <img className="obj42" src="/scada/combustion/obj-valve-small.svg" />
        <div className="rev-7-zone-per"></div>
        <img className="rev-7-zone-valve-1" src="/scada/combustion/zone-valve.svg" />
        <img className="rev-7-zone-valve-2" src="/scada/combustion/zone-valve.svg" />
      </div>
      <div className="rev-fire-group">
        <img className="rev-thun-1" src="/scada/combustion/rev-thun-10.png" />
        <img className="rev-fire-1" src="/scada/combustion/zone-fire.svg" />
        <img className="rev-thun-2" src="/scada/combustion/rev-thun-20.png" />
        <img className="rev-fire-2" src="/scada/combustion/zone-fire.svg" />
        <img className="rev-thun-3" src="/scada/combustion/rev-thun-30.png" />
        <img className="rev-fire-3" src="/scada/combustion/zone-fire.svg" />
        <img className="rev-thun-4" src="/scada/combustion/rev-thun-40.png" />
        <img className="rev-fire-4" src="/scada/combustion/zone-fire.svg" />
        <img className="rev-thun-5" src="/scada/combustion/rev-thun-50.png" />
        <img className="rev-fire-5" src="/scada/combustion/zone-fire.svg" />
        <img className="rev-thun-6" src="/scada/combustion/rev-thun-60.png" />
        <img className="rev-fire-6" src="/scada/combustion/zone-fire.svg" />
        <img className="rev-thun-7" src="/scada/combustion/rev-thun-70.png" />
        <img className="rev-fire-7" src="/scada/combustion/zone-fire.svg" />
        <img className="rev-thun-8" src="/scada/combustion/rev-thun-80.png" />
        <img className="rev-fire-8" src="/scada/combustion/zone-fire.svg" />
        <img className="rev-thun-9" src="/scada/combustion/rev-thun-90.png" />
        <img className="rev-fire-9" src="/scada/combustion/zone-fire.svg" />
        <img className="rev-thun-10" src="/scada/combustion/rev-thun-100.png" />
        <img className="rev-fire-10" src="/scada/combustion/zone-fire.svg" />
        <img className="rev-thun-11" src="/scada/combustion/rev-thun-110.png" />
        <img className="rev-fire-11" src="/scada/combustion/zone-fire.svg" />
        <img className="rev-thun-12" src="/scada/combustion/rev-thun-120.png" />
        <img className="rev-fire-12" src="/scada/combustion/zone-fire.svg" />
        <img className="rev-thun-13" src="/scada/combustion/rev-thun-130.png" />
        <img className="rev-fire-13" src="/scada/combustion/zone-fire.svg" />
        <img className="rev-thun-14" src="/scada/combustion/rev-thun-140.png" />
        <img className="rev-fire-14" src="/scada/combustion/zone-fire.svg" />
      </div>
    </div>
  );
}
