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
const scadaRoutes = [
  { index: true, element: MainPage },
  { path: 'drive', element: DrivePage },
  { path: 'combustion', element: CombustionPage },
  { path: 'temp', element: TempPage },
  { path: 'atmosphere', element: AtmospherePage },
  { path: 'cooling', element: CoolingPage },
  { path: 'trend', element: TrendPage },
  { path: 'alarm', element: AlarmPage },
  { path: 'alarmHistory', element: AlarmHistPage },
  { path: 'log', element: LogPage },
];

export default scadaRoutes;
