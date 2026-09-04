import { useEffect, useRef, useState } from 'react';

/**
 * 작화 그림을 화면 크기에 맞춰 줄이는 배율을 잰다.
 *
 * 작화 원본은 고정 px 크기라 그대로 그린 뒤 transform: scale로 통째로 줄인다.
 * 그래야 작화 CSS를 건드리지 않고도 창 크기에 맞고, 그림 위에 얹은 라벨도 같은
 * 비율로 따라 움직인다. 이 훅은 그 배율만 계산하고, 실제 transform은 쓰는 쪽이 건다.
 *
 * @param stageW 그림 원본 폭(px). 필수.
 * @param stageH 그림 원본 높이(px). 넘기면 가로·세로 중 작은 배율을 쓰고(그림이 다
 *               들어옴), 생략하면 가로에만 맞춘다(좌우 끝에 딱 붙고 높이는 따라온다).
 *
 *               가로 기준이 맞는 건 구동화면(4.2:1)·연소화면(4:1)처럼 옆으로 긴 그림이다.
 *               쿨링타워(2.1:1)·분위기제어(2.4:1)처럼 세로가 깊으면 가로에만 맞출 때
 *               높이가 화면을 넘치므로 stageH를 같이 넘겨야 한다.
 *
 * @returns [ref, scale] — ref는 크기를 잴 칸에 걸고, scale은 0으로 시작한다.
 *          0인 동안은 아직 못 잰 상태라 호출부에서 숨겨두는 게 좋다(원본 크기로 번쩍임 방지).
 */
export function useStageScale(stageW, stageH) {
  const ref = useRef(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (!width) return;

      const byWidth = width / stageW;
      // 높이를 안 넘겼으면 가로만 본다. 넘겼는데 높이가 0이면(아직 레이아웃 전) 가로만 본다.
      setScale(stageH && height ? Math.min(byWidth, height / stageH) : byWidth);
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [stageW, stageH]);

  return [ref, scale];
}

/**
 * 가로·세로를 각각 칸에 맞추는 배율을 잰다 — 그림이 칸을 빈틈없이 채운다.
 *
 * useStageScale은 가로·세로 중 작은 쪽을 써서 비율을 지키는 대신 남는 쪽에 여백이
 * 생긴다. 이 훅은 반대로 여백을 없애는 대신 그림이 늘어난다(원 → 타원).
 *
 * 연소화면처럼 아래 판들이 세로를 먼저 가져가서 그림이 작아지는데, 좌우 여백은
 * 비어 보이는 경우에 쓴다. 늘어난 티가 나면 안 되는 그림에는 쓰지 말 것.
 *
 * @param stageW 그림 원본 폭(px)
 * @param stageH 그림 원본 높이(px)
 * @returns [ref, {x, y}] — 둘 다 0으로 시작한다(아직 못 잰 상태).
 */
export function useStageStretch(stageW, stageH) {
  const ref = useRef(null);
  const [scale, setScale] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (!width || !height) return;

      /* 같은 값이 다시 들어오면 state를 갱신하지 않는다 — 매번 새 객체를 넣으면
         참조가 달라져 이 값을 의존성으로 쓰는 쪽이 불필요하게 다시 돈다. */
      setScale((prev) => {
        const x = width / stageW;
        const y = height / stageH;
        return prev.x === x && prev.y === y ? prev : { x, y };
      });
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [stageW, stageH]);

  return [ref, scale];
}
