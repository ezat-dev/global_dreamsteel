import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { IconFileTypePdf, IconPhoto, IconX } from '@tabler/icons-react';
import {
  alarmFileUrl, deleteAlarmFile, updateAlarmDesc, uploadAlarmFile,
} from '../../api/scada/alarmTagApi';
import { alarmMsgOf } from './alarmMsg';
import './AlarmDetailModal.css';

/* ===========================================================================
   알람 설명·파일 창 — 알람화면에서 칸을 누르면 열린다.

   알람마다 설명 하나, PDF 하나, 사진 하나(tb_alarm_tag의 alarm_desc / pdf_* / img_*).
   알람화면 "제어" 권한이면 고칠 수 있고, "조회" 권한이면 보기만 한다(canEdit).

   이 창은 화면 본문(.hmi-body) 밖에 그린다(portal). 조회 권한이면 본문 전체가
   <fieldset disabled>라서, 안에 두면 닫기 버튼까지 눌리지 않는다. 밖에 두고 무엇을 잠글지는
   canEdit으로 여기서 정한다. 어두운 테마는 감싸는 div의 hmi-dark가 입힌다.

   크기·형식은 서버도 같은 규칙으로 막지만, 올리기 전에 먼저 걸러 기다리지 않게 한다.
   =========================================================================== */

/** 서버 한도(application.yml spring.servlet.multipart.max-file-size)와 같은 값 */
const MAX_BYTES = 20 * 1024 * 1024;
/** 설명 칸(tb_alarm_tag.alarm_desc)이 VARCHAR(255)다 — 서버도 같은 한도 */
const DESC_MAX = 255;

const KINDS = {
  pdf: { exts: ['pdf'], accept: '.pdf,application/pdf', wrongKey: 'detail.pdfOnly' },
  img: { exts: ['jpg', 'jpeg', 'png'], accept: '.jpg,.jpeg,.png,image/jpeg,image/png', wrongKey: 'detail.imgOnly' },
};

const extOf = (name) => (name?.split('.').pop() ?? '').toLowerCase();

/**
 * @param tag       알람 한 행(getAlarmTagList) — tagId, tagName, address, alarmMsg(Eng),
 *                  alarmDesc, pdfFile, pdfName, imgFile, imgName
 * @param canEdit   true면 고칠 수 있다(알람화면 제어 권한)
 * @param onChanged (patch) => void — 저장·올리기·지우기 뒤 바뀐 칸만 넘긴다. 부르는 쪽이 목록에 합친다
 * @param onClose   닫기
 */
export default function AlarmDetailModal({ tag, canEdit, onChanged, onClose }) {
  const { t, i18n } = useTranslation('alarm');
  const [desc, setDesc] = useState(tag.alarmDesc ?? '');
  const [busy, setBusy] = useState('');          // 진행 중인 일 — 'desc' / 'pdf' / 'img'
  const [notice, setNotice] = useState('');      // 마지막 결과 안내
  const [error, setError] = useState('');
  const fileRefs = { pdf: useRef(null), img: useRef(null) };

  const dirty = desc !== (tag.alarmDesc ?? '');

  /* 닫기 — 저장 안 한 설명이 있으면 한 번 묻는다(실수로 막을 눌러 날리는 일을 막는다).
     처리 중에는 닫지 않는다 — 응답을 기다리는 중에 창이 사라지면 결과를 알 수 없다. */
  const requestClose = () => {
    if (busy) return;
    if (dirty && !window.confirm(t('detail.unsaved'))) return;
    onClose();
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') requestClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  const fail = (e) => setError(e?.response?.data?.message ?? e?.message ?? t('detail.failed'));

  const run = async (what, job) => {
    setBusy(what);
    setError('');
    setNotice('');
    try {
      await job();
    } catch (e) {
      fail(e);
    } finally {
      setBusy('');
    }
  };

  const saveDesc = () => run('desc', async () => {
    await updateAlarmDesc(tag.tagId, desc);
    onChanged({ alarmDesc: desc });
    setNotice(t('detail.saved'));
  });

  /* 파일 고르기 → 형식·크기 확인 → 올리기. 같은 파일을 다시 골라도 change가 나도록 값을 비운다. */
  const onPick = (kind) => (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!KINDS[kind].exts.includes(extOf(file.name))) { setError(t(KINDS[kind].wrongKey)); setNotice(''); return; }
    if (file.size > MAX_BYTES) { setError(t('detail.tooBig')); setNotice(''); return; }
    run(kind, async () => {
      const res = await uploadAlarmFile(tag.tagId, kind, file);
      const d = res.data ?? {};
      onChanged(kind === 'pdf'
        ? { pdfFile: d.pdfFile, pdfName: d.pdfName }
        : { imgFile: d.imgFile, imgName: d.imgName });
      setNotice(t('detail.uploaded', { name: kind === 'pdf' ? d.pdfName : d.imgName }));
    });
  };

  const remove = (kind) => {
    const name = kind === 'pdf' ? tag.pdfName : tag.imgName;
    if (!window.confirm(t('detail.removeConfirm', { name }))) return;
    run(kind, async () => {
      await deleteAlarmFile(tag.tagId, kind);
      onChanged(kind === 'pdf' ? { pdfFile: '', pdfName: '' } : { imgFile: '', imgName: '' });
      setNotice(t('detail.removed'));
    });
  };

  /** 파일 한 칸의 버튼 — 올리기(없을 때)/바꾸기(있을 때)와 지우기 */
  const fileButtons = (kind, has) => canEdit && (
    <span className="ad-file-btns">
      <input
        ref={fileRefs[kind]}
        type="file"
        accept={KINDS[kind].accept}
        onChange={onPick(kind)}
        hidden
      />
      <button type="button" className="hmi-btn" disabled={!!busy} onClick={() => fileRefs[kind].current?.click()}>
        {busy === kind ? t('detail.working') : (has ? t('detail.replace') : t('detail.upload'))}
      </button>
      {has && (
        <button type="button" className="hmi-btn ad-remove" disabled={!!busy} onClick={() => remove(kind)}>
          {t('detail.remove')}
        </button>
      )}
    </span>
  );

  const imgUrl = tag.imgFile ? alarmFileUrl(tag.tagId, 'img', tag.imgFile) : '';
  const pdfUrl = tag.pdfFile ? alarmFileUrl(tag.tagId, 'pdf', tag.pdfFile) : '';
  const title = alarmMsgOf(tag, i18n.language) || tag.tagName;

  const modal = (
    <div className="hmi-dark">
      <div
        className="hmi-umodal-scrim"
        onMouseDown={(e) => { if (e.target === e.currentTarget) requestClose(); }}
      >
        <div className="hmi-umodal ad-modal" role="dialog" aria-label={title}>
          <div className="hmi-umodal-title ad-title">
            <span className="ad-title-text">
              {title}
              <small>{`${tag.tagName} · ${tag.address}`}</small>
            </span>
            <button type="button" className="ad-close" onClick={requestClose} aria-label={t('detail.close')} title={t('detail.close')}>
              <IconX size={18} />
            </button>
          </div>

          <div className="hmi-umodal-body ad-body">
            {!canEdit && <div className="ad-readonly">{t('detail.readOnly')}</div>}

            {/* ── 설명 ── */}
            <section className="ad-sec">
              <div className="ad-sec-head">
                <span className="ad-sec-name">{t('detail.desc')}</span>
                {canEdit && <span className="ad-count">{`${desc.length}/${DESC_MAX}`}</span>}
              </div>
              {canEdit ? (
                <>
                  <textarea
                    className="hmi-umodal-input ad-desc"
                    value={desc}
                    onChange={(e) => { setDesc(e.target.value); setNotice(''); setError(''); }}
                    maxLength={DESC_MAX}
                    rows={4}
                    placeholder={t('detail.descPlaceholder')}
                  />
                  <div className="ad-row-end">
                    <button type="button" className="hmi-btn is-primary" disabled={!dirty || !!busy} onClick={saveDesc}>
                      {busy === 'desc' ? t('detail.saving') : t('detail.save')}
                    </button>
                  </div>
                </>
              ) : (
                <div className={`ad-desc-view${tag.alarmDesc ? '' : ' is-empty'}`}>
                  {tag.alarmDesc || t('detail.descEmpty')}
                </div>
              )}
            </section>

            {/* ── 사진 ── 미리보기를 누르면 새 탭에서 원본 크기로 */}
            <section className="ad-sec">
              <div className="ad-sec-head">
                <span className="ad-sec-name"><IconPhoto size={15} />{t('detail.photo')}</span>
                {fileButtons('img', !!tag.imgFile)}
              </div>
              {tag.imgFile ? (
                <a className="ad-photo" href={imgUrl} target="_blank" rel="noreferrer" title={t('detail.photoTip')}>
                  <img src={imgUrl} alt={tag.imgName} />
                  <span className="ad-file-name">{tag.imgName}</span>
                </a>
              ) : (
                <div className="ad-none">{t('detail.none')}</div>
              )}
            </section>

            {/* ── PDF ── 새 탭에서 브라우저의 PDF 보기로 연다 */}
            <section className="ad-sec">
              <div className="ad-sec-head">
                <span className="ad-sec-name"><IconFileTypePdf size={15} />{t('detail.pdf')}</span>
                {fileButtons('pdf', !!tag.pdfFile)}
              </div>
              {tag.pdfFile ? (
                <a className="ad-pdf" href={pdfUrl} target="_blank" rel="noreferrer">
                  <IconFileTypePdf size={18} />
                  <span className="ad-file-name">{tag.pdfName}</span>
                  <span className="ad-open">{t('detail.open')}</span>
                </a>
              ) : (
                <div className="ad-none">{t('detail.none')}</div>
              )}
            </section>

            {error && <div className="hmi-umodal-error">{error}</div>}
            {!error && notice && <div className="ad-notice">{notice}</div>}
          </div>

          <div className="hmi-umodal-foot">
            <button type="button" className="hmi-btn" onClick={requestClose} disabled={!!busy}>
              {t('detail.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // 화면 틀(.hmi-root) 안, 본문 fieldset 밖에 그린다 — 글꼴·토큰은 틀의 것을 그대로 쓴다
  return createPortal(modal, document.querySelector('.hmi-root') ?? document.body);
}
