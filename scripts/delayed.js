// add delayed functionality here

// Load Swiper.js for timeline blocks
if (document.querySelector('.tabs.timeline')) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css';
  document.head.append(link);

  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js';
  document.head.append(script);
}
