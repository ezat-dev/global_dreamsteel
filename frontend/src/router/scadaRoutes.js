import MainPage from '../pages/scada/MainPage';
import DrivePage from '../pages/scada/DrivePage';
import CombustionPage from '../pages/scada/CombustionPage';
import TempPage from '../pages/scada/TempPage';
import AtmospherePage from '../pages/scada/AtmospherePage';
import CoolingPage from '../pages/scada/CoolingPage';
import TrendPage from '../pages/scada/TrendPage';
import AlarmPage from '../pages/scada/AlarmPage';
import AlarmHistPage from '../pages/scada/AlarmHistPage';
import LogPage from '../pages/scada/LogPage';

// ScadaLayout(상단 제목바 + 하단 메뉴바) 하위에서 렌더링되는 화면 목록.
// path는 루트('/') 기준 상대 경로이고, constants/scadaMenu.js의 절대 경로와 짝을 이룬다.
//
// key: constants/scadaMenu.js의 같은 화면 key와 반드시 같아야 한다. App.jsx가 이 key로
// RequireScreen을 감싸서 권한(0 없음 / 1 조회 / 2 제어)을 확인한다. 관리자 전용인 로그도
// 별도 표시 없이 같은 길로 막힌다 — 권한 판정은 AuthContext 한 곳에 모여 있다.
const scadaRoutes = [
  { index: true, key: 'main', element: MainPage },
  { path: 'drive', key: 'drive', element: DrivePage },
  { path: 'combustion', key: 'combustion', element: CombustionPage },
  { path: 'temp', key: 'temp', element: TempPage },
  { path: 'atmosphere', key: 'atmosphere', element: AtmospherePage },
  { path: 'cooling', key: 'cooling', element: CoolingPage },
  { path: 'trend', key: 'trend', element: TrendPage },
  { path: 'alarm', key: 'alarm', element: AlarmPage },
  { path: 'alarmHistory', key: 'alarmHistory', element: AlarmHistPage },
  { path: 'log', key: 'log', element: LogPage },
];

export default scadaRoutes;
