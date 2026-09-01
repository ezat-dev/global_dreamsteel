import { useEffect, useState } from 'react';

const pad = (n) => String(n).padStart(2, '0');

function format(d) {
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} `
    + `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * 상단 우측 시계. 1초마다 갱신한다.
 *
 * 인터벌을 1000ms로 두면 시작 시점의 밀리초 오프셋만큼 밀려서 초가 한 번씩 건너뛰어
 * 보이므로, 다음 "정각 초"까지만 기다렸다가 그때부터 1초 간격으로 맞춘다.
 */
export default function ScadaClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let interval;
    const timeout = setTimeout(() => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), 1000);
    }, 1000 - (Date.now() % 1000));

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  return <div className="hmi-clock">{format(now)}</div>;
}
