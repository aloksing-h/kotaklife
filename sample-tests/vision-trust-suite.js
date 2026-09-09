/**
 * Vision & Trust Section Figma Compliance Test Suite
 *
 * Injected into the page via Chrome DevTools evaluate_script.
 * Measures real DOM and compares against Figma-extracted constants.
 * Returns structured { cases: [...], summary: { pass, fail, total } }
 */

(() => {
  const TOLERANCE_PX = 2;
  const results = [];
  let pass = 0;
  let fail = 0;

  function check(name, actual, expected, tolerance) {
    if (tolerance === undefined) tolerance = TOLERANCE_PX;
    const diff = Math.abs(actual - expected);
    const ok = diff <= tolerance;
    if (ok) pass++; else fail++;
    results.push({
      name,
      actual: Math.round(actual * 10) / 10,
      expected,
      diff: Math.round(diff * 10) / 10,
      status: ok ? 'PASS' : 'FAIL',
    });
  }

  function checkColor(name, actualStr, expectedHex) {
    // Convert expected hex to rgb string
    let hex = expectedHex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    const n = parseInt(hex, 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    // Browser may return rgb(r, g, b) or rgba(r, g, b, a)
    const normalised = actualStr.replace(/\s+/g, '').toLowerCase();
    const expected1 = (`rgb(${r},${g},${b})`).toLowerCase();
    const expected2 = (`rgba(${r},${g},${b},1)`).toLowerCase();
    const ok = (normalised === expected1 || normalised === expected2);
    if (ok) pass++; else fail++;
    results.push({
      name,
      actual: actualStr,
      expected: expectedHex,
      diff: ok ? 0 : 'color mismatch',
      status: ok ? 'PASS' : 'FAIL',
    });
  }

  function cssNum(el, prop) {
    return parseFloat(getComputedStyle(el)[prop]) || 0;
  }

  function cssColor(el, prop) {
    return getComputedStyle(el)[prop];
  }

  /* ── VISION SECTION ── */
  const vision = document.querySelector('.vision');
  if (vision) {
    const h1 = vision.querySelector('.rte.default-title h1');
    if (h1) {
      check('vision h1 font-size', cssNum(h1, 'fontSize'), 48);
      check('vision h1 font-weight', cssNum(h1, 'fontWeight'), 300);
      check('vision h1 line-height', cssNum(h1, 'lineHeight'), 60);
      checkColor('vision h1 color', cssColor(h1, 'color'), '#181D27');
    }

    const desc = vision.querySelector('.rte.default-title p');
    if (desc) {
      check('vision desc font-size', cssNum(desc, 'fontSize'), 16);
      check('vision desc font-weight', cssNum(desc, 'fontWeight'), 500);
      checkColor('vision desc color', cssColor(desc, 'color'), '#535862');
    }

    const ul = vision.querySelector('.cards > ul');
    if (ul) {
      const ulRect = ul.getBoundingClientRect();
      check('vision strip width', ulRect.width, 1100, 4);
      check('vision strip border-top', cssNum(ul, 'borderTopWidth'), 1);
      check('vision strip border-bottom', cssNum(ul, 'borderBottomWidth'), 1);

      const lis = ul.querySelectorAll(':scope > li');
      check('vision card count', lis.length, 3, 0);

      if (lis.length >= 1) {
        const li0 = lis[0];
        const li0Rect = li0.getBoundingClientRect();
        check('vision card-0 height', li0Rect.height, 180, 8);
        check('vision card-0 padding-top', cssNum(li0, 'paddingTop'), 42);
        check('vision card-0 padding-bottom', cssNum(li0, 'paddingBottom'), 42);
        check('vision card-0 padding-left', cssNum(li0, 'paddingLeft'), 28);
        check('vision card-0 padding-right', cssNum(li0, 'paddingRight'), 28);

        const icon = li0.querySelector('.cards-card-image');
        if (icon) {
          const irect = icon.getBoundingClientRect();
          check('vision card-0 icon width', irect.width, 40);
          check('vision card-0 icon height', irect.height, 40);
        }

        const title = li0.querySelector('.cards-card-body p strong');
        if (title) {
          check('vision card-0 title font-size', cssNum(title, 'fontSize'), 16);
          check('vision card-0 title font-weight', cssNum(title, 'fontWeight'), 600);
          checkColor('vision card-0 title color', cssColor(title, 'color'), '#181D27');
        }

        const cdesc = li0.querySelector('.cards-card-body p');
        if (cdesc) {
          check('vision card-0 desc font-size', cssNum(cdesc, 'fontSize'), 14);
          check('vision card-0 desc font-weight', cssNum(cdesc, 'fontWeight'), 500);
          checkColor('vision card-0 desc color', cssColor(cdesc, 'color'), '#535862');
        }
      }

      if (lis.length >= 1) {
        const beforeBg = getComputedStyle(lis[0], '::before').background;
        check('vision card-0 ring pseudo exists', beforeBg ? 1 : 0, 1, 0);
      }
    }
  }

  /* ── TRUST SECTION ── */
  const trust = document.querySelector('.section.trust');
  if (trust) {
    const th1 = trust.querySelector('.rte.default-title h1');
    if (th1) {
      check('trust h1 font-size', cssNum(th1, 'fontSize'), 48);
      check('trust h1 font-weight', cssNum(th1, 'fontWeight'), 300);
    }

    const tdesc = trust.querySelector('.rte.default-title p');
    if (tdesc) {
      check('trust desc font-size', cssNum(tdesc, 'fontSize'), 16);
      check('trust desc font-weight', cssNum(tdesc, 'fontWeight'), 500);
      checkColor('trust desc color', cssColor(tdesc, 'color'), '#535862');
      check('trust desc max-width', cssNum(tdesc, 'maxWidth'), 420);
    }

    const tul = trust.querySelector('.cards > ul');
    if (tul) {
      check('trust strip max-height', cssNum(tul, 'maxHeight'), 277);
      check('trust strip border-top', cssNum(tul, 'borderTopWidth'), 1);
      check('trust strip border-bottom', cssNum(tul, 'borderBottomWidth'), 1);

      const tlis = tul.querySelectorAll(':scope > li');
      check('trust card count', tlis.length, 4, 0);

      if (tlis.length >= 1) {
        const tli0 = tlis[0];
        const ticon = tli0.querySelector('.cards-card-image');
        if (ticon) {
          const tirect = ticon.getBoundingClientRect();
          check('trust card-0 icon width', tirect.width, 48);
          check('trust card-0 icon height', tirect.height, 48);
        }

        const ttitle = tli0.querySelector('.cards-card-body p strong');
        if (ttitle) {
          check('trust card-0 title font-size', cssNum(ttitle, 'fontSize'), 18);
          check('trust card-0 title font-weight', cssNum(ttitle, 'fontWeight'), 600);
          checkColor('trust card-0 title color', cssColor(ttitle, 'color'), '#181D27');
        }

        const tcdesc = tli0.querySelector('.cards-card-body p');
        if (tcdesc) {
          check('trust card-0 desc font-size', cssNum(tcdesc, 'fontSize'), 14);
          check('trust card-0 desc font-weight', cssNum(tcdesc, 'fontWeight'), 500);
          checkColor('trust card-0 desc color', cssColor(tcdesc, 'color'), '#535862');
        }

        check('trust card-0 gap', cssNum(tli0, 'gap'), 105);

        const lastLi = tlis[tlis.length - 1];
        const lastBR = getComputedStyle(lastLi).borderRightWidth;
        check('trust last-card no right-border', parseFloat(lastBR) || 0, 0, 0);
      }

      if (tlis.length >= 1) {
        const blobBg = getComputedStyle(tlis[0], '::before').backgroundImage;
        check('trust card-0 has blob', blobBg.indexOf('blue-bg') >= 0 ? 1 : 0, 1, 0);
      }
    }

    check('trust section max-width', cssNum(trust, 'maxWidth'), 1200);
  }

  const mainSection = document.querySelector('main > .section');
  if (mainSection) {
    const inner = mainSection.querySelector(':scope > div');
    if (inner) {
      check('content column max-width', cssNum(inner, 'maxWidth'), 1100);
    }
  }

  return {
    cases: results,
    summary: { pass, fail, total: pass + fail },
  };
})();
