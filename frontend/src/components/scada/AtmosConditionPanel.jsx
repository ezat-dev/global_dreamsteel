import { useTranslation } from 'react-i18next';

/**
 * 분위기 제어 자동모드 동작 조건 — 자동모드로 넘어가기 위한 전제 조건 램프판.
 *
 * 조작하는 곳이 아니라 PLC 상태를 그대로 비추는 표시등이라 클릭 대상이 아니다.
 * 값을 보고 색을 정하는 일은 부르는 쪽(AtmospherePage)이 한다 — 줄마다 초록이 되는
 * 값이 달라서(greenWhen), 여기서는 받은 클래스를 붙이기만 한다.
 *
 * @param conditions [{ key, tag, lamp }]
 *                   lamp는 램프에 붙일 클래스(' on' / ' alarm' / ' unknown')
 *                   줄 글자는 사전 atmosphere.json의 cond.<태그>에서 찾는다
 */
export default function AtmosConditionPanel({ conditions }) {
  const { t } = useTranslation('atmosphere');
  return (
    <div className="at-cond">
      <div className="at-cond-title">{t('condTitle')}</div>

      <div className="at-cond-body">
        {conditions.map((c) => (
          <div
            className="at-cond-row"
            key={c.key}
            data-tag={c.tag}
            title={t('common:hmi.readOnly', { what: t(`cond.${c.tag}`), tag: c.tag })}
          >
            <span className={`at-cond-lamp${c.lamp ?? ''}`} />
            <span className="at-cond-text">{t(`cond.${c.tag}`)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
