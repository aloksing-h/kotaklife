/*
 * Embed Block
 * Show videos and social posts directly on your page
 * https://www.hlx.live/developer/block-collection/embed
 */

import { getRespectiveDomain } from '../../scripts/dom-helpers.js';

async function resolveMediaUrl(href) {
  try {
    const url = new URL(href, window.location.href);
    if (url.pathname.startsWith('/content/')) {
      let domain = await getRespectiveDomain();
      if (domain === true) {
        domain = 'https://publish-p48457-e1275402.adobeaemcloud.com';
      }
      return domain + url.pathname;
    }
    return url.href;
  } catch {
    return href;
  }
}

const loadScript = (url, callback, type) => {
  const head = document.querySelector('head');
  const script = document.createElement('script');
  script.src = url;
  if (type) {
    script.setAttribute('type', type);
  }
  script.onload = callback;
  head.append(script);
  return script;
};

const getDefaultEmbed = (url) => `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
    <iframe src="${url.href}" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" allowfullscreen=""
      scrolling="no" allow="encrypted-media" title="Content from ${url.hostname}" loading="lazy">
    </iframe>
  </div>`;

const embedYoutube = (url, autoplay) => {
  const usp = new URLSearchParams(url.search);
  const suffix = autoplay ? '&muted=1&autoplay=1' : '';
  let vid = usp.get('v') ? encodeURIComponent(usp.get('v')) : '';
  const embed = url.pathname;
  if (url.origin.includes('youtu.be')) {
    [, vid] = url.pathname.split('/');
  }
  const embedHTML = `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
      <iframe src="https://www.youtube.com${vid ? `/embed/${vid}?rel=0&v=${vid}${suffix}` : embed}" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" 
      allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope; picture-in-picture" allowfullscreen="" scrolling="no" title="Content from Youtube" loading="lazy"></iframe>
    </div>`;
  return embedHTML;
};

const embedVimeo = (url, autoplay) => {
  const [, video] = url.pathname.split('/');
  const suffix = autoplay ? '?muted=1&autoplay=1' : '';
  const embedHTML = `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
      <iframe src="https://player.vimeo.com/video/${video}${suffix}" 
      style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" 
      frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen  
      title="Content from Vimeo" loading="lazy"></iframe>
    </div>`;
  return embedHTML;
};

const embedTwitter = (url) => {
  const embedHTML = `<blockquote class="twitter-tweet"><a href="${url.href}"></a></blockquote>`;
  loadScript('https://platform.twitter.com/widgets.js');
  return embedHTML;
};

const embedDirectVideo = (url, autoplay) => {
  const autoPlayAttr = autoplay ? 'autoplay' : '';
  const embedHTML = `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
      <video src="${url.href}" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute; background-color: #000;" 
      controls ${autoPlayAttr} playsinline name="media"></video>
    </div>`;
  return embedHTML;
};

// FIX 1: Added 'async' keyword here
const loadEmbed = async (block, link, autoplay) => {
  if (block.classList.contains('embed-is-loaded')) {
    return;
  }

  const EMBEDS_CONFIG = [
    { match: ['youtube', 'youtu.be'], embed: embedYoutube },
    { match: ['vimeo'], embed: embedVimeo },
    { match: ['twitter'], embed: embedTwitter },
    { match: ['.mp4', '.webm', '.ogg'], embed: embedDirectVideo },
  ];

  const config = EMBEDS_CONFIG.find((e) => e.match.some((match) => link.includes(match)));
  let finalLink = link;

  if (config) {
    if (config.embed === embedDirectVideo) {
      finalLink = await resolveMediaUrl(link);
    }
    // FIX 2: Create url object with base window.location for relative paths
    const url = new URL(finalLink);
    block.innerHTML = config.embed(url, autoplay);
    // Remove the dot for a valid class name
    block.classList.add(`embed-${config.match[0].replace('.', '')}`);
  } else {
    // FIX 3: Ensure 'url' is defined if no config matches
    const url = new URL(finalLink, window.location.href);
    block.innerHTML = getDefaultEmbed(url);
  }

  block.classList.add('embed-is-loaded');
};

export default function decorate(block) {
  const a = block.querySelector('a');
  // FIX 4: Use getAttribute to prevent the browser from automatically rewriting the URL
  const link = a ? (a.getAttribute('href') || a.href) : block.textContent.trim();
  block.textContent = '';

  const isCustomerSay = block.classList.contains('customer-say-video') || block.classList.contains('customer-say');
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      observer.disconnect();
      loadEmbed(block, link, isCustomerSay);
    }
  });

  observer.observe(block);
}
