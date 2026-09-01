/* ===========================================================================
   구동화면 설비 그림 — 작화 도구가 뽑아준 index.html을 그대로 옮긴 것.

   클래스 이름은 작화 style.css(= pages/scada/driveOverview.css)와 1:1로 묶여 있어서
   하나도 바꾸면 안 된다. 원본과 줄 단위로 대조할 수 있게 순서·이름을 그대로 두었고,
   바꾼 것은 딱 두 가지다.
     - class=      → className=      (JSX 문법)
     - src="A.png" → src="/scada/drive/A.png"  (public 폴더로 옮겨서 경로가 생김)

   그림은 1981x406px 고정 크기다. 화면 폭에 맞춰 줄이는 일은 이 컴포넌트를 감싸는
   쪽(DrivePage)에서 transform: scale로 처리한다 — 작화 CSS는 건드리지 않는다.
   =========================================================================== */

export default function DriveOverview() {
  return (
    <div className="overview-1">
      <div className="entrance-conv">
        <img className="ent-obj-1" src="/scada/drive/ent-obj-10.png" />
        <img className="ent-obj-2" src="/scada/drive/ent-obj-20.png" />
        <img className="ent-obj-3" src="/scada/drive/ent-obj-30.png" />
        <img className="ent-obj-4" src="/scada/drive/ent-obj-40.png" />
        <img className="ent-obj-5" src="/scada/drive/ent-obj-50.png" />
        <img className="ent-obj-6" src="/scada/drive/ent-obj-60.png" />
        <img className="ent-conv-1" src="/scada/drive/ent-conv-10.png" />
        <img className="ent-conv-2" src="/scada/drive/ent-conv-20.png" />
        <img className="ent-conv-3" src="/scada/drive/ent-conv-30.png" />
        <img className="ent-conv-4" src="/scada/drive/ent-conv-40.png" />
        <img className="ent-conv-5" src="/scada/drive/ent-conv-50.png" />
        <img className="ent-conv-6" src="/scada/drive/ent-conv-60.png" />
        <img className="ent-conv-7" src="/scada/drive/ent-conv-70.png" />
        <img className="ent-conv-8" src="/scada/drive/ent-conv-80.png" />
        <img className="ent-conv-9" src="/scada/drive/ent-conv-90.png" />
        <img className="ent-conv-10" src="/scada/drive/ent-conv-100.png" />
        <img className="ent-conv-11" src="/scada/drive/ent-conv-110.png" />
        <img className="ent-conv-12" src="/scada/drive/ent-conv-120.png" />
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
          <div className="mini-rail"></div>
          <div className="mini-rail2"></div>
          <div className="mini-rail3"></div>
          <div className="mini-rail4"></div>
          <div className="mini-rail5"></div>
          <div className="mini-rail6"></div>
          <div className="mini-rail7"></div>
          <div className="mini-rail8"></div>
          <div className="mini-rail9"></div>
          <div className="mini-rail10"></div>
          <div className="mini-rail11"></div>
          <div className="mini-rail12"></div>
          <div className="mini-rail13"></div>
          <div className="mini-rail14"></div>
          <div className="mini-rail15"></div>
          <div className="mini-rail16"></div>
          <div className="mini-rail17"></div>
          <div className="mini-rail18"></div>
          <div className="mini-rail19"></div>
          <div className="mini-rail20"></div>
          <div className="mini-rail21"></div>
          <div className="mini-rail22"></div>
          <div className="mini-rail23"></div>
          <div className="mini-rail24"></div>
          <div className="mini-rail25"></div>
          <div className="mini-rail26"></div>
          <div className="mini-rail27"></div>
          <div className="mini-rail28"></div>
          <div className="mini-rail29"></div>
          <div className="mini-rail30"></div>
          <div className="mini-rail31"></div>
          <div className="mini-rail32"></div>
          <div className="mini-rail33"></div>
          <div className="mini-rail34"></div>
          <div className="mini-rail35"></div>
          <div className="mini-rail36"></div>
          <div className="mini-rail37"></div>
          <div className="mini-rail38"></div>
          <div className="mini-rail39"></div>
        </div>
        <div className="ent-rail-2">
          <div className="mini-rail40"></div>
          <div className="mini-rail41"></div>
          <div className="mini-rail42"></div>
          <div className="mini-rail43"></div>
          <div className="mini-rail44"></div>
          <div className="mini-rail45"></div>
          <div className="mini-rail46"></div>
          <div className="mini-rail47"></div>
          <div className="mini-rail48"></div>
          <div className="mini-rail49"></div>
          <div className="mini-rail50"></div>
          <div className="mini-rail51"></div>
          <div className="mini-rail52"></div>
          <div className="mini-rail53"></div>
          <div className="mini-rail54"></div>
          <div className="mini-rail55"></div>
          <div className="mini-rail56"></div>
          <div className="mini-rail57"></div>
          <div className="mini-rail58"></div>
          <div className="mini-rail59"></div>
          <div className="mini-rail60"></div>
          <div className="mini-rail61"></div>
          <div className="mini-rail62"></div>
          <div className="mini-rail63"></div>
          <div className="mini-rail64"></div>
          <div className="mini-rail65"></div>
          <div className="mini-rail66"></div>
          <div className="mini-rail67"></div>
          <div className="mini-rail68"></div>
          <div className="mini-rail69"></div>
          <div className="mini-rail70"></div>
          <div className="mini-rail71"></div>
          <div className="mini-rail72"></div>
          <div className="mini-rail73"></div>
          <div className="mini-rail74"></div>
          <div className="mini-rail75"></div>
          <div className="mini-rail76"></div>
          <div className="mini-rail77"></div>
          <div className="mini-rail78"></div>
        </div>
        <div className="ent-rail-3">
          <div className="mini-rail79"></div>
          <div className="mini-rail80"></div>
          <div className="mini-rail81"></div>
          <div className="mini-rail82"></div>
          <div className="mini-rail83"></div>
          <div className="mini-rail84"></div>
          <div className="mini-rail85"></div>
          <div className="mini-rail86"></div>
          <div className="mini-rail87"></div>
          <div className="mini-rail88"></div>
          <div className="mini-rail89"></div>
          <div className="mini-rail90"></div>
          <div className="mini-rail91"></div>
          <div className="mini-rail92"></div>
          <div className="mini-rail93"></div>
          <div className="mini-rail94"></div>
          <div className="mini-rail95"></div>
          <div className="mini-rail96"></div>
          <div className="mini-rail97"></div>
          <div className="mini-rail98"></div>
          <div className="mini-rail99"></div>
          <div className="mini-rail100"></div>
          <div className="mini-rail101"></div>
          <div className="mini-rail102"></div>
          <div className="mini-rail103"></div>
          <div className="mini-rail104"></div>
          <div className="mini-rail105"></div>
          <div className="mini-rail106"></div>
          <div className="mini-rail107"></div>
          <div className="mini-rail108"></div>
          <div className="mini-rail109"></div>
          <div className="mini-rail110"></div>
          <div className="mini-rail111"></div>
          <div className="mini-rail112"></div>
          <div className="mini-rail113"></div>
          <div className="mini-rail114"></div>
          <div className="mini-rail115"></div>
          <div className="mini-rail116"></div>
          <div className="mini-rail117"></div>
        </div>
        <div className="ent-rail-4">
          <div className="mini-rail118"></div>
          <div className="mini-rail119"></div>
          <div className="mini-rail120"></div>
          <div className="mini-rail121"></div>
          <div className="mini-rail122"></div>
          <div className="mini-rail123"></div>
          <div className="mini-rail124"></div>
          <div className="mini-rail125"></div>
          <div className="mini-rail126"></div>
          <div className="mini-rail127"></div>
          <div className="mini-rail128"></div>
          <div className="mini-rail129"></div>
          <div className="mini-rail130"></div>
          <div className="mini-rail131"></div>
          <div className="mini-rail132"></div>
          <div className="mini-rail133"></div>
          <div className="mini-rail134"></div>
          <div className="mini-rail135"></div>
          <div className="mini-rail136"></div>
          <div className="mini-rail137"></div>
          <div className="mini-rail138"></div>
          <div className="mini-rail139"></div>
          <div className="mini-rail140"></div>
          <div className="mini-rail141"></div>
          <div className="mini-rail142"></div>
          <div className="mini-rail143"></div>
          <div className="mini-rail144"></div>
          <div className="mini-rail145"></div>
          <div className="mini-rail146"></div>
          <div className="mini-rail147"></div>
          <div className="mini-rail148"></div>
          <div className="mini-rail149"></div>
          <div className="mini-rail150"></div>
          <div className="mini-rail151"></div>
          <div className="mini-rail152"></div>
          <div className="mini-rail153"></div>
          <div className="mini-rail154"></div>
          <div className="mini-rail155"></div>
          <div className="mini-rail156"></div>
        </div>
        <div className="ent-rail-5">
          <div className="mini-rail157"></div>
          <div className="mini-rail158"></div>
          <div className="mini-rail159"></div>
          <div className="mini-rail160"></div>
          <div className="mini-rail161"></div>
          <div className="mini-rail162"></div>
          <div className="mini-rail163"></div>
          <div className="mini-rail164"></div>
          <div className="mini-rail165"></div>
          <div className="mini-rail166"></div>
          <div className="mini-rail167"></div>
          <div className="mini-rail168"></div>
          <div className="mini-rail169"></div>
          <div className="mini-rail170"></div>
          <div className="mini-rail171"></div>
          <div className="mini-rail172"></div>
          <div className="mini-rail173"></div>
          <div className="mini-rail174"></div>
          <div className="mini-rail175"></div>
          <div className="mini-rail176"></div>
          <div className="mini-rail177"></div>
          <div className="mini-rail178"></div>
          <div className="mini-rail179"></div>
          <div className="mini-rail180"></div>
          <div className="mini-rail181"></div>
          <div className="mini-rail182"></div>
          <div className="mini-rail183"></div>
          <div className="mini-rail184"></div>
          <div className="mini-rail185"></div>
          <div className="mini-rail186"></div>
          <div className="mini-rail187"></div>
          <div className="mini-rail188"></div>
          <div className="mini-rail189"></div>
          <div className="mini-rail190"></div>
          <div className="mini-rail191"></div>
          <div className="mini-rail192"></div>
          <div className="mini-rail193"></div>
          <div className="mini-rail194"></div>
          <div className="mini-rail195"></div>
        </div>
        <div className="ent-rail-6">
          <div className="mini-rail196"></div>
          <div className="mini-rail197"></div>
          <div className="mini-rail198"></div>
          <div className="mini-rail199"></div>
          <div className="mini-rail200"></div>
          <div className="mini-rail201"></div>
          <div className="mini-rail202"></div>
          <div className="mini-rail203"></div>
          <div className="mini-rail204"></div>
          <div className="mini-rail205"></div>
          <div className="mini-rail206"></div>
          <div className="mini-rail207"></div>
          <div className="mini-rail208"></div>
          <div className="mini-rail209"></div>
          <div className="mini-rail210"></div>
          <div className="mini-rail211"></div>
          <div className="mini-rail212"></div>
          <div className="mini-rail213"></div>
          <div className="mini-rail214"></div>
          <div className="mini-rail215"></div>
          <div className="mini-rail216"></div>
          <div className="mini-rail217"></div>
          <div className="mini-rail218"></div>
          <div className="mini-rail219"></div>
          <div className="mini-rail220"></div>
          <div className="mini-rail221"></div>
          <div className="mini-rail222"></div>
          <div className="mini-rail223"></div>
          <div className="mini-rail224"></div>
          <div className="mini-rail225"></div>
          <div className="mini-rail226"></div>
          <div className="mini-rail227"></div>
          <div className="mini-rail228"></div>
          <div className="mini-rail229"></div>
          <div className="mini-rail230"></div>
          <div className="mini-rail231"></div>
          <div className="mini-rail232"></div>
          <div className="mini-rail233"></div>
          <div className="mini-rail234"></div>
        </div>
        <img className="ent-up-1" src="/scada/drive/ent-up-10.png" />
        <img className="ent-down-1" src="/scada/drive/ent-down-10.png" />
        <img className="ent-up-2" src="/scada/drive/ent-up-20.png" />
        <img className="ent-down-2" src="/scada/drive/ent-down-20.png" />
        <img className="ent-up-3" src="/scada/drive/ent-up-30.png" />
        <img className="ent-down-3" src="/scada/drive/ent-down-30.png" />
        <img className="ent-up-4" src="/scada/drive/ent-up-40.png" />
        <img className="ent-down-4" src="/scada/drive/ent-down-40.png" />
        <img className="ent-motor-1" src="/scada/drive/ent-motor-10.png" />
        <img className="ent-motor-2" src="/scada/drive/ent-motor-20.png" />
        <img className="ent-motor-3" src="/scada/drive/ent-motor-30.png" />
        <img className="ent-motor-4" src="/scada/drive/ent-motor-40.png" />
        <img className="ent-door-1" src="/scada/drive/ent-door-10.png" />
      </div>
      <div className="main-drive">
        <img className="main-1-zone" src="/scada/drive/main-1-zone0.png" />
        <img className="main-2-zone" src="/scada/drive/main-2-zone0.png" />
        <img className="main-3-zone" src="/scada/drive/main-3-zone0.png" />
        <img className="main-4-zone" src="/scada/drive/main-4-zone0.png" />
        <img className="main-5-zone" src="/scada/drive/main-5-zone0.png" />
        <img className="main-6-zone" src="/scada/drive/main-6-zone0.png" />
        <img className="main-7-zone" src="/scada/drive/main-7-zone0.png" />
        <img className="main-obj-2" src="/scada/drive/main-obj-20.png" />
        <img className="main-obj-1" src="/scada/drive/main-obj-10.png" />
        <img className="main-motor-1" src="/scada/drive/main-motor-10.png" />
        <img className="main-motor-2" src="/scada/drive/main-motor-20.png" />
      </div>
      <div className="exit-conv">
        <img className="exit-obj-1" src="/scada/drive/exit-obj-10.png" />
        <img className="exit-obj-2" src="/scada/drive/exit-obj-20.png" />
        <img className="exit-obj-3" src="/scada/drive/exit-obj-30.png" />
        <img className="exit-obj-4" src="/scada/drive/exit-obj-40.png" />
        <img className="exit-obj-5" src="/scada/drive/exit-obj-50.png" />
        <img className="exit-obj-6" src="/scada/drive/exit-obj-60.png" />
        <img className="exit-conv-1" src="/scada/drive/exit-conv-10.png" />
        <img className="exit-conv-2" src="/scada/drive/exit-conv-20.png" />
        <img className="exit-conv-3" src="/scada/drive/exit-conv-30.png" />
        <img className="exit-conv-6" src="/scada/drive/exit-conv-60.png" />
        <img className="exit-conv-8" src="/scada/drive/exit-conv-80.png" />
        <img className="exit-conv-9" src="/scada/drive/exit-conv-90.png" />
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
          <div className="mini-rail235"></div>
          <div className="mini-rail236"></div>
          <div className="mini-rail237"></div>
          <div className="mini-rail238"></div>
          <div className="mini-rail239"></div>
          <div className="mini-rail240"></div>
          <div className="mini-rail241"></div>
          <div className="mini-rail242"></div>
          <div className="mini-rail243"></div>
          <div className="mini-rail244"></div>
          <div className="mini-rail245"></div>
          <div className="mini-rail246"></div>
          <div className="mini-rail247"></div>
          <div className="mini-rail248"></div>
          <div className="mini-rail249"></div>
          <div className="mini-rail250"></div>
          <div className="mini-rail251"></div>
          <div className="mini-rail252"></div>
          <div className="mini-rail253"></div>
          <div className="mini-rail254"></div>
          <div className="mini-rail255"></div>
          <div className="mini-rail256"></div>
          <div className="mini-rail257"></div>
          <div className="mini-rail258"></div>
          <div className="mini-rail259"></div>
          <div className="mini-rail260"></div>
          <div className="mini-rail261"></div>
          <div className="mini-rail262"></div>
          <div className="mini-rail263"></div>
          <div className="mini-rail264"></div>
          <div className="mini-rail265"></div>
          <div className="mini-rail266"></div>
          <div className="mini-rail267"></div>
          <div className="mini-rail268"></div>
          <div className="mini-rail269"></div>
          <div className="mini-rail270"></div>
          <div className="mini-rail271"></div>
          <div className="mini-rail272"></div>
          <div className="mini-rail273"></div>
        </div>
        <div className="exit-rail-2">
          <div className="mini-rail274"></div>
          <div className="mini-rail275"></div>
          <div className="mini-rail276"></div>
          <div className="mini-rail277"></div>
          <div className="mini-rail278"></div>
          <div className="mini-rail279"></div>
          <div className="mini-rail280"></div>
          <div className="mini-rail281"></div>
          <div className="mini-rail282"></div>
          <div className="mini-rail283"></div>
          <div className="mini-rail284"></div>
          <div className="mini-rail285"></div>
          <div className="mini-rail286"></div>
          <div className="mini-rail287"></div>
          <div className="mini-rail288"></div>
          <div className="mini-rail289"></div>
          <div className="mini-rail290"></div>
          <div className="mini-rail291"></div>
          <div className="mini-rail292"></div>
          <div className="mini-rail293"></div>
          <div className="mini-rail294"></div>
          <div className="mini-rail295"></div>
          <div className="mini-rail296"></div>
          <div className="mini-rail297"></div>
          <div className="mini-rail298"></div>
          <div className="mini-rail299"></div>
          <div className="mini-rail300"></div>
          <div className="mini-rail301"></div>
          <div className="mini-rail302"></div>
          <div className="mini-rail303"></div>
          <div className="mini-rail304"></div>
          <div className="mini-rail305"></div>
          <div className="mini-rail306"></div>
          <div className="mini-rail307"></div>
          <div className="mini-rail308"></div>
          <div className="mini-rail309"></div>
          <div className="mini-rail310"></div>
          <div className="mini-rail311"></div>
          <div className="mini-rail312"></div>
        </div>
        <div className="exit-rail-3">
          <div className="mini-rail313"></div>
          <div className="mini-rail314"></div>
          <div className="mini-rail315"></div>
          <div className="mini-rail316"></div>
          <div className="mini-rail317"></div>
          <div className="mini-rail318"></div>
          <div className="mini-rail319"></div>
          <div className="mini-rail320"></div>
          <div className="mini-rail321"></div>
          <div className="mini-rail322"></div>
          <div className="mini-rail323"></div>
          <div className="mini-rail324"></div>
          <div className="mini-rail325"></div>
          <div className="mini-rail326"></div>
          <div className="mini-rail327"></div>
          <div className="mini-rail328"></div>
          <div className="mini-rail329"></div>
          <div className="mini-rail330"></div>
          <div className="mini-rail331"></div>
          <div className="mini-rail332"></div>
          <div className="mini-rail333"></div>
          <div className="mini-rail334"></div>
          <div className="mini-rail335"></div>
          <div className="mini-rail336"></div>
          <div className="mini-rail337"></div>
          <div className="mini-rail338"></div>
          <div className="mini-rail339"></div>
          <div className="mini-rail340"></div>
          <div className="mini-rail341"></div>
          <div className="mini-rail342"></div>
          <div className="mini-rail343"></div>
          <div className="mini-rail344"></div>
          <div className="mini-rail345"></div>
          <div className="mini-rail346"></div>
          <div className="mini-rail347"></div>
          <div className="mini-rail348"></div>
          <div className="mini-rail349"></div>
          <div className="mini-rail350"></div>
          <div className="mini-rail351"></div>
        </div>
        <div className="exit-rail-4">
          <div className="mini-rail352"></div>
          <div className="mini-rail353"></div>
          <div className="mini-rail354"></div>
          <div className="mini-rail355"></div>
          <div className="mini-rail356"></div>
          <div className="mini-rail357"></div>
          <div className="mini-rail358"></div>
          <div className="mini-rail359"></div>
          <div className="mini-rail360"></div>
          <div className="mini-rail361"></div>
          <div className="mini-rail362"></div>
          <div className="mini-rail363"></div>
          <div className="mini-rail364"></div>
          <div className="mini-rail365"></div>
          <div className="mini-rail366"></div>
          <div className="mini-rail367"></div>
          <div className="mini-rail368"></div>
          <div className="mini-rail369"></div>
          <div className="mini-rail370"></div>
          <div className="mini-rail371"></div>
          <div className="mini-rail372"></div>
          <div className="mini-rail373"></div>
          <div className="mini-rail374"></div>
          <div className="mini-rail375"></div>
          <div className="mini-rail376"></div>
          <div className="mini-rail377"></div>
          <div className="mini-rail378"></div>
          <div className="mini-rail379"></div>
          <div className="mini-rail380"></div>
          <div className="mini-rail381"></div>
          <div className="mini-rail382"></div>
          <div className="mini-rail383"></div>
          <div className="mini-rail384"></div>
          <div className="mini-rail385"></div>
          <div className="mini-rail386"></div>
          <div className="mini-rail387"></div>
          <div className="mini-rail388"></div>
          <div className="mini-rail389"></div>
          <div className="mini-rail390"></div>
        </div>
        <div className="exit-rail-5">
          <div className="mini-rail391"></div>
          <div className="mini-rail392"></div>
          <div className="mini-rail393"></div>
          <div className="mini-rail394"></div>
          <div className="mini-rail395"></div>
          <div className="mini-rail396"></div>
          <div className="mini-rail397"></div>
          <div className="mini-rail398"></div>
          <div className="mini-rail399"></div>
          <div className="mini-rail400"></div>
          <div className="mini-rail401"></div>
          <div className="mini-rail402"></div>
          <div className="mini-rail403"></div>
          <div className="mini-rail404"></div>
          <div className="mini-rail405"></div>
          <div className="mini-rail406"></div>
          <div className="mini-rail407"></div>
          <div className="mini-rail408"></div>
          <div className="mini-rail409"></div>
          <div className="mini-rail410"></div>
          <div className="mini-rail411"></div>
          <div className="mini-rail412"></div>
          <div className="mini-rail413"></div>
          <div className="mini-rail414"></div>
          <div className="mini-rail415"></div>
          <div className="mini-rail416"></div>
          <div className="mini-rail417"></div>
          <div className="mini-rail418"></div>
          <div className="mini-rail419"></div>
          <div className="mini-rail420"></div>
          <div className="mini-rail421"></div>
          <div className="mini-rail422"></div>
          <div className="mini-rail423"></div>
          <div className="mini-rail424"></div>
          <div className="mini-rail425"></div>
          <div className="mini-rail426"></div>
          <div className="mini-rail427"></div>
          <div className="mini-rail428"></div>
          <div className="mini-rail429"></div>
        </div>
        <div className="exit-rail-6">
          <div className="mini-rail430"></div>
          <div className="mini-rail431"></div>
          <div className="mini-rail432"></div>
          <div className="mini-rail433"></div>
          <div className="mini-rail434"></div>
          <div className="mini-rail435"></div>
          <div className="mini-rail436"></div>
          <div className="mini-rail437"></div>
          <div className="mini-rail438"></div>
          <div className="mini-rail439"></div>
          <div className="mini-rail440"></div>
          <div className="mini-rail441"></div>
          <div className="mini-rail442"></div>
          <div className="mini-rail443"></div>
          <div className="mini-rail444"></div>
          <div className="mini-rail445"></div>
          <div className="mini-rail446"></div>
          <div className="mini-rail447"></div>
          <div className="mini-rail448"></div>
          <div className="mini-rail449"></div>
          <div className="mini-rail450"></div>
          <div className="mini-rail451"></div>
          <div className="mini-rail452"></div>
          <div className="mini-rail453"></div>
          <div className="mini-rail454"></div>
          <div className="mini-rail455"></div>
          <div className="mini-rail456"></div>
          <div className="mini-rail457"></div>
          <div className="mini-rail458"></div>
          <div className="mini-rail459"></div>
          <div className="mini-rail460"></div>
          <div className="mini-rail461"></div>
          <div className="mini-rail462"></div>
          <div className="mini-rail463"></div>
          <div className="mini-rail464"></div>
          <div className="mini-rail465"></div>
          <div className="mini-rail466"></div>
          <div className="mini-rail467"></div>
          <div className="mini-rail468"></div>
        </div>
        <img className="exit-up-1" src="/scada/drive/exit-up-10.png" />
        <img className="exit-down-1" src="/scada/drive/exit-down-10.png" />
        <img className="exit-up-2" src="/scada/drive/exit-up-20.png" />
        <img className="exit-down-2" src="/scada/drive/exit-down-20.png" />
        <img className="exit-up-3" src="/scada/drive/exit-up-30.png" />
        <img className="exit-down-3" src="/scada/drive/exit-down-30.png" />
        <img className="exit-up-4" src="/scada/drive/exit-up-40.png" />
        <img className="exit-down-4" src="/scada/drive/exit-down-40.png" />
        <img className="exit-motor-1" src="/scada/drive/exit-motor-10.png" />
        <img className="exit-motor-2" src="/scada/drive/exit-motor-20.png" />
        <img className="exit-motor-3" src="/scada/drive/exit-motor-30.png" />
        <img className="exit-motor-4" src="/scada/drive/exit-motor-40.png" />
        <img className="exit-motor-5" src="/scada/drive/exit-motor-50.png" />
      </div>
    </div>
  );
}
